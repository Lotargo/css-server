const hasTauri = typeof window !== "undefined" && !!window.__TAURI__;
const { listen, emit } = hasTauri
  ? window.__TAURI__.event
  : {
      listen: (event, handler) => {
        if (!window._listeners) window._listeners = {};
        if (!window._listeners[event]) window._listeners[event] = [];
        window._listeners[event].push(handler);
        return Promise.resolve(() => {
          window._listeners[event] = window._listeners[event].filter(h => h !== handler);
        });
      },
      emit: (event, payload) => {
        if (window._listeners && window._listeners[event]) {
          window._listeners[event].forEach(handler => handler({ payload }));
        }
        if (event === "history-request") {
          setTimeout(() => {
            const mockHistory = JSON.parse(localStorage.getItem("mock_calc_history") || "[]");
            if (window._listeners && window._listeners["history-response"]) {
              window._listeners["history-response"].forEach(handler => handler({ payload: mockHistory }));
            }
          }, 50);
        }
        if (event === "db-write-request") {
          setTimeout(() => {
            const mockHistory = JSON.parse(localStorage.getItem("mock_calc_history") || "[]");
            mockHistory.unshift({
              id: payload.request_id,
              val_a: payload.val_a,
              val_b: payload.val_b,
              result: payload.result,
              operator: payload.operator,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem("mock_calc_history", JSON.stringify(mockHistory));
            if (window._listeners && window._listeners["db-write-response"]) {
              window._listeners["db-write-response"].forEach(handler => handler({ 
                payload: { request_id: payload.request_id, status: "success" } 
              }));
            }
          }, 50);
        }
        if (event === "clear-history-request") {
          setTimeout(() => {
            localStorage.removeItem("mock_calc_history");
            if (window._listeners && window._listeners["clear-history-response"]) {
              window._listeners["clear-history-response"].forEach(handler => handler({ payload: "success" }));
            }
          }, 50);
        }
        return Promise.resolve();
      }
    };

const MAX_LOG = 100;
const logPanel = document.getElementById("log-list");

function log(level, source, message, data) {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = `[${ts}][${level}][${source}]`;
  const text = data ? `${message} ${JSON.stringify(data)}` : message;

  if (level === "ERROR") console.error(prefix, text);
  else if (level === "WARN") console.warn(prefix, text);
  else console.info(prefix, text);

  // Emit to Rust system bus
  emit("js-log", { level, source, message, data }).catch(() => {});

  if (!logPanel) return;
  const entry = document.createElement("div");
  entry.className = `log-entry log-${level.toLowerCase()}`;
  entry.textContent = `${prefix} ${text}`;
  logPanel.appendChild(entry);
  if (logPanel.children.length > MAX_LOG) {
    logPanel.removeChild(logPanel.firstChild);
  }
  logPanel.scrollTop = logPanel.scrollHeight;
}

const inbound = document.getElementById("inbound");
const aluLane = document.getElementById("alu-lane");
const dbQueue = document.getElementById("db-write-queue");

function updateCounter() {
  const count = document.querySelectorAll(".request").length;
  const counterEl = document.getElementById("status-counter");
  if (counterEl) {
    counterEl.textContent = `active: ${count}`;
  }
}

// Sidebar Tab Switcher
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    
    btn.classList.add("active");
    const activeTab = document.getElementById(`${btn.dataset.tab}-tab`);
    if (activeTab) {
      activeTab.classList.add("active");
    }
  });
});

// Calculator State
let displayVal = "0";
let expressionVal = "";
let accumulator = null;
let pendingOp = null;
let shouldResetDisplay = false;
let memoryList = [];

const displayEl = document.getElementById("calculator-display");
const previewEl = document.getElementById("expression-preview");

const memBtns = {
  mc: document.getElementById("btn-mc"),
  mr: document.getElementById("btn-mr"),
  mPlus: document.getElementById("btn-m-plus"),
  mMinus: document.getElementById("btn-m-minus"),
  ms: document.getElementById("btn-ms"),
  mList: document.getElementById("btn-m-list")
};

function updateUi() {
  // Format numbers for clean display
  displayEl.textContent = displayVal.replace(".", ",");
  previewEl.textContent = expressionVal;
  
  // Enable / disable memory buttons based on memoryList length
  const hasMemory = memoryList.length > 0;
  if (memBtns.mc) memBtns.mc.disabled = !hasMemory;
  if (memBtns.mr) memBtns.mr.disabled = !hasMemory;
  if (memBtns.mList) memBtns.mList.disabled = !hasMemory;
  
  renderMemoryList();
}

function freezeUi(freeze) {
  const btns = document.querySelectorAll("#calculator-grid button, #memory-bar button");
  btns.forEach(b => {
    b.disabled = freeze;
  });
  // MC, MR, MList might need to stay disabled based on memory rules
  if (!freeze) {
    const hasMemory = memoryList.length > 0;
    if (memBtns.mc) memBtns.mc.disabled = !hasMemory;
    if (memBtns.mr) memBtns.mr.disabled = !hasMemory;
    if (memBtns.mList) memBtns.mList.disabled = !hasMemory;
  }
}

function formatNumber(num) {
  if (isNaN(num)) return "NaN";
  if (!isFinite(num)) return "Infinity";
  const s = num.toString();
  if (s.length > 12) {
    if (Math.abs(num) < 1e-6 || Math.abs(num) > 1e12) {
      return num.toExponential(6);
    }
    return parseFloat(num.toFixed(10)).toString();
  }
  return s;
}

function getOpSymbol(op) {
  const map = {
    add: "+",
    sub: "−",
    mul: "×",
    div: "÷"
  };
  return map[op] || op;
}

// Routing calculator arithmetic to CSS ALU
function performCssArithmetic(valA, valB, op, callback) {
  const requestId = crypto.randomUUID();
  const node = document.createElement("div");
  node.className = "request math-task";
  node.dataset.requestId = requestId;
  node.dataset.a = String(valA);
  node.dataset.b = String(valB);
  node.dataset.op = op;
  
  const opSymbolMap = {
    add: "+",
    sub: "−",
    mul: "×",
    div: "÷",
    inv: "1/x",
    sqr: "x²",
    sqrt: "²√x",
    pct: "%"
  };
  node.dataset.opSymbol = opSymbolMap[op] || op;

  if (aluLane) {
    aluLane.appendChild(node);
    updateCounter();
  }

  log("INFO", "alu", `manual operation triggered: ${valA} ${opSymbolMap[op] || op} ${valB}`);

  // Fetch computed styles after renderer resolves it
  setTimeout(() => {
    const style = getComputedStyle(node);
    const resultVal = style.getPropertyValue("--result").trim();
    const result = parseFloat(resultVal);

    log("INFO", "alu", `manual operation computed result: ${result}`);

    // Persist to database via Tauri event
    emit("db-write-request", {
      request_id: requestId,
      val_a: valA,
      val_b: valB,
      result: isNaN(result) ? 0 : result,
      operator: opSymbolMap[op] || "+"
    }).then(() => {
      log("DEBUG", "database", `db-write-request sent for manual task [id: ${requestId}]`);
    }).catch(err => {
      log("ERROR", "database", "failed to emit db-write-request", err);
    });

    callback(result);

    // Animate completion flow through pipeline
    setTimeout(() => {
      if (dbQueue && node.parentNode === aluLane) {
        dbQueue.appendChild(node);
      }
      setTimeout(() => {
        node.remove();
        updateCounter();
        // Load updated history list
        requestHistory();
      }, 500);
    }, 400);
  }, 100);
}

// Database History Integration
function requestHistory() {
  emit("history-request").catch(err => {
    log("ERROR", "database", "failed to request history", err);
  });
}

function renderHistory(calculations) {
  const historyList = document.getElementById("history-list");
  const historyEmpty = document.getElementById("history-empty");
  const clearBtn = document.getElementById("clear-history-btn");
  
  if (!historyList) return;
  
  historyList.innerHTML = "";
  
  if (calculations.length === 0) {
    if (historyEmpty) historyEmpty.style.display = "block";
    if (clearBtn) clearBtn.disabled = true;
    return;
  }
  
  if (historyEmpty) historyEmpty.style.display = "none";
  if (clearBtn) clearBtn.disabled = false;
  
  calculations.forEach(item => {
    const entry = document.createElement("div");
    entry.className = "history-item";
    
    // Check if single operand or double operand
    const isSingleOp = ["1/x", "x²", "²√x"].includes(item.operator);
    let equationText = "";
    if (isSingleOp) {
      if (item.operator === "1/x") equationText = `1/(${formatNumber(item.val_a)}) =`;
      else if (item.operator === "x²") equationText = `sqr(${formatNumber(item.val_a)}) =`;
      else if (item.operator === "²√x") equationText = `√(${formatNumber(item.val_a)}) =`;
    } else {
      equationText = `${formatNumber(item.val_a)} ${item.operator} ${formatNumber(item.val_b)} =`;
    }
    
    const exprDiv = document.createElement("div");
    exprDiv.className = "history-expr";
    exprDiv.textContent = equationText;
    
    const resDiv = document.createElement("div");
    resDiv.className = "history-result";
    resDiv.textContent = formatNumber(item.result);
    
    entry.appendChild(exprDiv);
    entry.appendChild(resDiv);
    
    // Load calculation back into calculator when clicked
    entry.addEventListener("click", () => {
      displayVal = String(item.result);
      expressionVal = equationText;
      accumulator = null;
      pendingOp = null;
      shouldResetDisplay = true;
      updateUi();
    });
    
    historyList.appendChild(entry);
  });
}

// Memory Operations
function renderMemoryList() {
  const memoryListEl = document.getElementById("memory-list");
  const memoryEmpty = document.getElementById("memory-empty");
  
  if (!memoryListEl) return;
  
  memoryListEl.innerHTML = "";
  
  if (memoryList.length === 0) {
    if (memoryEmpty) memoryEmpty.style.display = "block";
    return;
  }
  
  if (memoryEmpty) memoryEmpty.style.display = "none";
  
  memoryList.forEach((mem, index) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    
    const valueDiv = document.createElement("div");
    valueDiv.className = "memory-value";
    valueDiv.textContent = formatNumber(mem);
    
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "memory-actions";
    
    const mcBtn = document.createElement("button");
    mcBtn.textContent = "MC";
    mcBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      memoryList.splice(index, 1);
      updateUi();
    });
    
    const mPlusBtn = document.createElement("button");
    mPlusBtn.textContent = "M+";
    mPlusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      memoryList[index] += parseFloat(displayVal);
      updateUi();
    });
    
    const mMinusBtn = document.createElement("button");
    mMinusBtn.textContent = "M-";
    mMinusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      memoryList[index] -= parseFloat(displayVal);
      updateUi();
    });
    
    actionsDiv.appendChild(mcBtn);
    actionsDiv.appendChild(mPlusBtn);
    actionsDiv.appendChild(mMinusBtn);
    
    item.appendChild(valueDiv);
    item.appendChild(actionsDiv);
    
    // Load back into display when clicked
    item.addEventListener("click", () => {
      displayVal = String(mem);
      shouldResetDisplay = true;
      updateUi();
    });
    
    memoryListEl.appendChild(item);
  });
}

// Bind Calculator Click Handlers
document.querySelectorAll("#calculator-grid button").forEach(btn => {
  btn.addEventListener("click", () => {
    const btnText = btn.textContent.trim();
    const id = btn.id;
    
    if (btn.classList.contains("btn-num")) {
      handleNumInput(btnText);
    } else if (btn.classList.contains("btn-op")) {
      handleOpInput(id, btnText);
    } else if (btn.classList.contains("btn-eq")) {
      handleEquals();
    }
  });
});

function handleNumInput(num) {
  if (num === ",") {
    if (shouldResetDisplay) {
      displayVal = "0.";
      shouldResetDisplay = false;
    } else if (!displayVal.includes(".")) {
      displayVal += ".";
    }
  } else {
    if (displayVal === "0" || shouldResetDisplay) {
      displayVal = num;
      shouldResetDisplay = false;
    } else {
      displayVal += num;
    }
  }
  updateUi();
}

function handleOpInput(id, symbol) {
  const currentVal = parseFloat(displayVal);
  
  if (id === "btn-c") {
    displayVal = "0";
    expressionVal = "";
    accumulator = null;
    pendingOp = null;
    shouldResetDisplay = false;
    updateUi();
  } else if (id === "btn-ce") {
    displayVal = "0";
    updateUi();
  } else if (id === "btn-back") {
    displayVal = displayVal.slice(0, -1);
    if (displayVal === "" || displayVal === "-") {
      displayVal = "0";
    }
    updateUi();
  } else if (id === "btn-neg") {
    if (displayVal !== "0") {
      if (displayVal.startsWith("-")) {
        displayVal = displayVal.substring(1);
      } else {
        displayVal = "-" + displayVal;
      }
      updateUi();
    }
  } else if (id === "btn-pct") {
    if (accumulator !== null && pendingOp) {
      freezeUi(true);
      performCssArithmetic(accumulator, currentVal, "pct", (res) => {
        displayVal = String(res);
        shouldResetDisplay = true;
        freezeUi(false);
        updateUi();
      });
    } else {
      displayVal = String(currentVal / 100);
      updateUi();
    }
  } else if (["btn-inv", "btn-sqr", "btn-sqrt"].includes(id)) {
    let op = "";
    let preview = "";
    if (id === "btn-inv") {
      op = "inv";
      preview = `1/(${formatNumber(currentVal)})`;
    } else if (id === "btn-sqr") {
      op = "sqr";
      preview = `sqr(${formatNumber(currentVal)})`;
    } else if (id === "btn-sqrt") {
      op = "sqrt";
      preview = `√(${formatNumber(currentVal)})`;
    }
    
    freezeUi(true);
    performCssArithmetic(currentVal, 0, op, (res) => {
      expressionVal = `${preview} =`;
      displayVal = String(res);
      shouldResetDisplay = true;
      freezeUi(false);
      updateUi();
    });
  } else {
    // Binary operations (+, -, *, /)
    let op = "";
    if (id === "btn-add") op = "add";
    else if (id === "btn-sub") op = "sub";
    else if (id === "btn-mul") op = "mul";
    else if (id === "btn-div") op = "div";
    
    if (accumulator === null) {
      accumulator = currentVal;
      pendingOp = op;
      expressionVal = `${formatNumber(accumulator)} ${getOpSymbol(op)}`;
      shouldResetDisplay = true;
      updateUi();
    } else if (pendingOp && !shouldResetDisplay) {
      const prevOp = pendingOp;
      freezeUi(true);
      performCssArithmetic(accumulator, currentVal, prevOp, (res) => {
        accumulator = res;
        pendingOp = op;
        expressionVal = `${formatNumber(accumulator)} ${getOpSymbol(op)}`;
        displayVal = String(res);
        shouldResetDisplay = true;
        freezeUi(false);
        updateUi();
      });
    } else {
      pendingOp = op;
      expressionVal = `${formatNumber(accumulator)} ${getOpSymbol(op)}`;
      updateUi();
    }
  }
}

function handleEquals() {
  if (accumulator === null || pendingOp === null) return;
  const currentVal = parseFloat(displayVal);
  const op = pendingOp;
  
  freezeUi(true);
  performCssArithmetic(accumulator, currentVal, op, (res) => {
    expressionVal = `${formatNumber(accumulator)} ${getOpSymbol(op)} ${formatNumber(currentVal)} =`;
    displayVal = String(res);
    accumulator = null;
    pendingOp = null;
    shouldResetDisplay = true;
    freezeUi(false);
    updateUi();
  });
}

// Bind Memory Bar buttons
if (memBtns.ms) {
  memBtns.ms.addEventListener("click", () => {
    memoryList.unshift(parseFloat(displayVal));
    shouldResetDisplay = true;
    updateUi();
  });
}
if (memBtns.mc) {
  memBtns.mc.addEventListener("click", () => {
    memoryList = [];
    updateUi();
  });
}
if (memBtns.mr) {
  memBtns.mr.addEventListener("click", () => {
    if (memoryList.length > 0) {
      displayVal = String(memoryList[0]);
      shouldResetDisplay = true;
      updateUi();
    }
  });
}
if (memBtns.mPlus) {
  memBtns.mPlus.addEventListener("click", () => {
    if (memoryList.length === 0) {
      memoryList.push(parseFloat(displayVal));
    } else {
      memoryList[0] += parseFloat(displayVal);
    }
    shouldResetDisplay = true;
    updateUi();
  });
}
if (memBtns.mMinus) {
  memBtns.mMinus.addEventListener("click", () => {
    if (memoryList.length === 0) {
      memoryList.push(-parseFloat(displayVal));
    } else {
      memoryList[0] -= parseFloat(displayVal);
    }
    shouldResetDisplay = true;
    updateUi();
  });
}
if (memBtns.mList) {
  memBtns.mList.addEventListener("click", () => {
    // Open memory sidebar tab
    const memTabBtn = document.querySelector('[data-tab="memory"]');
    if (memTabBtn) memTabBtn.click();
  });
}

// Clear history click
const clearHistoryBtn = document.getElementById("clear-history-btn");
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    emit("clear-history-request").catch(err => {
      log("ERROR", "database", "failed to request clearing history", err);
    });
  });
}

async function setup() {
  log("INFO", "compat", "detecting CSS compatibility...");
  const supportsIf = CSS.supports('color', 'if(style(--foo: 1): red; else: blue)');
  const supportsTypedAttr = CSS.supports('width', 'attr(data-w type(<number>))');
  
  log("INFO", "compat", `CSS if() support: ${supportsIf}`);
  log("INFO", "compat", `CSS typed attr() support: ${supportsTypedAttr}`);
  
  if (!supportsIf || !supportsTypedAttr) {
    log("WARN", "compat", "CRITICAL WARNING: The current WebView does not support CSS if() or typed attr(). Requests will time out!");
  }

  log("INFO", "sysbus", "listening for http-request events");

  // Load history immediately on setup
  requestHistory();

  await listen("db-write-response", (event) => {
    const { request_id, status } = event.payload;
    log("INFO", "database", `db response received [id: ${request_id}], status: ${status}`);
    const node = document.querySelector(`[data-request-id="${request_id}"]`);
    if (node) {
      node.dataset.dbResult = status;
      log("DEBUG", "dom", `node data-db-result set to ${status} [id: ${request_id}]`);
    }
    // Reload history list if db write was successful
    if (status === "success") {
      requestHistory();
    }
  });

  await listen("history-response", (event) => {
    const calculations = event.payload;
    log("DEBUG", "database", `fetched ${calculations.length} history items`);
    renderHistory(calculations);
  });

  await listen("clear-history-response", (event) => {
    const status = event.payload;
    if (status === "success") {
      log("INFO", "database", "history database cleared successfully");
      requestHistory();
    } else {
      log("ERROR", "database", "failed to clear history database");
    }
  });

  await listen("http-request", (event) => {
    const { request_id, a, b } = event.payload;

    log("INFO", "sysbus", `request received [id: ${request_id}]`, { a, b });

    const node = document.createElement("div");
    node.className = "request add-task";
    node.dataset.requestId = request_id;
    node.dataset.a = String(a);
    node.dataset.b = String(b);

    let finished = false;

    // Watchdog timer (3.2 seconds) to catch stuck/silent requests
    const watchdog = setTimeout(() => {
      if (finished) return;
      finished = true;

      // Extract computed variables for diagnostic tracing
      const style = getComputedStyle(node);
      const valA = style.getPropertyValue("--val-a").trim();
      const valB = style.getPropertyValue("--val-b").trim();
      const result = style.getPropertyValue("--result").trim();

      log("ERROR", "alu", `watchdog triggered - execution timed out [id: ${request_id}]`, {
        computed_val_a: valA || "undefined",
        computed_val_b: valB || "undefined",
        computed_result: result || "undefined",
        message: "CSS animation failed to trigger/end. Check feature support."
      });

      emit("http-response", {
        request_id: request_id,
        result: "Error: CSS animation timeout (unsupported features)",
      }).then(() => {
        log("DEBUG", "sysbus", `timeout response emitted [id: ${request_id}]`);
      }).catch((err) => {
        log("ERROR", "sysbus", `failed to emit timeout response [id: ${request_id}]`, { error: err });
      });

      node.remove();
      updateCounter();
    }, 3200);

    node.addEventListener("animationend", (evt) => {
      if (finished) return;

      log("DEBUG", "dom", `animation ended: ${evt.animationName} [id: ${request_id}]`);

      if (evt.animationName === "slide-to-db") {
        log("INFO", "alu", `ALU calculation complete, routing to DB write [id: ${request_id}]`);
        const style = getComputedStyle(node);
        const result = style.getPropertyValue("--result").trim();

        // Move DOM node to DB write queue
        if (dbQueue) {
          dbQueue.appendChild(node);
          log("DEBUG", "dom", `node appended to DB write queue [id: ${request_id}]`);
        }

        // Emit syscall request to Rust bus
        emit("db-write-request", {
          request_id: request_id,
          val_a: parseFloat(node.dataset.a),
          val_b: parseFloat(node.dataset.b),
          result: parseFloat(result)
        }).then(() => {
          log("DEBUG", "sysbus", `db-write-request event emitted [id: ${request_id}]`);
        }).catch((err) => {
          log("ERROR", "sysbus", `failed to emit db-write-request [id: ${request_id}]`, { error: err });
          node.dataset.dbResult = "error";
        });
        
        return; // Wait for db-write-response to trigger next animation
      }

      if (evt.animationName === "slide-from-db-to-outbound" || evt.animationName === "drop-to-trash") {
        finished = true;
        clearTimeout(watchdog);

        const style = getComputedStyle(node);
        const result = style.getPropertyValue("--result").trim();

        let responseResult = result;
        let responseStatus = 200;
        
        if (evt.animationName === "drop-to-trash") {
          // Check if it failed due to database write error or negative input
          if (node.dataset.dbResult === "error") {
            responseResult = "Error: database persistent write failure";
          } else {
            responseResult = "Error: negative input or constraint violation";
          }
          responseStatus = 400;
        }

        log("INFO", "sysbus", `request final dispatch [id: ${request_id}]`, {
          status: responseStatus,
          result: responseResult
        });

        emit("http-response", {
          request_id: request_id,
          result: responseResult || "NaN",
        }).then(() => {
          log("DEBUG", "sysbus", `response emitted [id: ${request_id}]`);
        }).catch((err) => {
          log("ERROR", "sysbus", `failed to emit response [id: ${request_id}]`, { error: err });
        });

        node.remove();
        updateCounter();
      }
    });

    if (inbound) {
      inbound.appendChild(node);
      log("DEBUG", "dom", `node appended to inbound [id: ${request_id}]`);
      updateCounter();
    }

    setTimeout(() => {
      if (!finished && node.parentNode === inbound) {
        if (aluLane) {
          aluLane.appendChild(node);
          log("DEBUG", "dom", `node moved to ALU lane [id: ${request_id}]`);
        }
      }
    }, 400);
  });

  log("INFO", "sysbus", "listener established");

  // Control Deck interaction (embedded in Server Tab)
  const dispatchBtn = document.getElementById("dispatch-btn");
  const inputA = document.getElementById("input-a");
  const inputB = document.getElementById("input-b");
  const monitorResult = document.getElementById("monitor-result");

  if (dispatchBtn && inputA && inputB && monitorResult) {
    dispatchBtn.addEventListener("click", () => {
      const aVal = parseFloat(inputA.value);
      const bVal = parseFloat(inputB.value);

      if (isNaN(aVal) || isNaN(bVal)) {
        monitorResult.textContent = "ERR: INVALID INPUT";
        monitorResult.className = "monitor-error";
        return;
      }

      log("INFO", "controldeck", `dispatching manual calculation: ${aVal} + ${bVal}`);

      // Disable UI during transaction
      dispatchBtn.disabled = true;
      inputA.disabled = true;
      inputB.disabled = true;
      
      monitorResult.textContent = "DISPATCHING...";
      monitorResult.className = "monitor-loading";

      // Execute request directly through local system HTTP server port
      fetch("http://localhost:8080/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ a: aVal, b: bVal })
      })
      .then(async (res) => {
        const text = await res.text();
        if (res.ok) {
          monitorResult.textContent = text.trim();
          monitorResult.className = "monitor-success";
          log("INFO", "controldeck", `manual calculation resolved: ${text.trim()}`);
        } else {
          monitorResult.textContent = "ERR: " + text.trim().substring(0, 16).toUpperCase();
          monitorResult.className = "monitor-error";
          log("WARN", "controldeck", `manual calculation failed: ${text.trim()}`);
        }
      })
      .catch((err) => {
        monitorResult.textContent = "ERR: CONNECT FAIL";
        monitorResult.className = "monitor-error";
        log("ERROR", "controldeck", `failed to contact system bus: ${err.message}`);
      })
      .finally(() => {
        dispatchBtn.disabled = false;
        inputA.disabled = false;
        inputB.disabled = false;
      });
    });
  }
}

// --- Drawer and Mode selection ---
const menuBtn = document.getElementById("menu-btn");
const navDrawer = document.getElementById("nav-drawer");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerItems = document.querySelectorAll(".drawer-item");

function toggleDrawer(open) {
  if (open) {
    if (navDrawer) navDrawer.classList.add("open");
    if (drawerOverlay) drawerOverlay.classList.add("open");
  } else {
    if (navDrawer) navDrawer.classList.remove("open");
    if (drawerOverlay) drawerOverlay.classList.remove("open");
  }
}

if (menuBtn && navDrawer && drawerOverlay) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navDrawer.classList.contains("open");
    toggleDrawer(!isOpen);
  });
  drawerOverlay.addEventListener("click", () => toggleDrawer(false));
}

const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
const sidebarPane = document.getElementById("sidebar-pane");
if (sidebarToggleBtn && sidebarPane) {
  sidebarToggleBtn.addEventListener("click", () => {
    const isHidden = sidebarPane.style.display === "none";
    const appContainer = document.getElementById("calculator-app");
    if (isHidden) {
      sidebarPane.style.display = "flex";
      if (appContainer) appContainer.style.gridTemplateColumns = "1.3fr 1fr";
    } else {
      sidebarPane.style.display = "none";
      if (appContainer) appContainer.style.gridTemplateColumns = "1fr";
    }
  });
}

drawerItems.forEach(item => {
  item.addEventListener("click", () => {
    const mode = item.dataset.mode;
    
    // Close drawer
    toggleDrawer(false);
    
    if (mode === "standard") {
      drawerItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      const titleEl = document.getElementById("calc-title");
      if (titleEl) titleEl.textContent = "Обычный";
    } else {
      let modeName = item.querySelector("span") ? item.querySelector("span").textContent : "Этот режим";
      showToast(`Режим "${modeName}" временно заблокирован. Вернитесь к "Обычному" режиму.`);
    }
  });
});

// --- Toast Notifications ---
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Force reflow and fade in
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  // Fade out and remove
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- Compact Mode ---
const compactBtn = document.getElementById("compact-btn");
let isCompact = false;

if (compactBtn) {
  compactBtn.addEventListener("click", async () => {
    isCompact = !isCompact;
    
    const iconExpand = compactBtn.querySelector(".icon-expand");
    const iconShrink = compactBtn.querySelector(".icon-shrink");
    const appContainer = document.getElementById("calculator-app");
    
    if (isCompact) {
      if (iconExpand) iconExpand.style.display = "none";
      if (iconShrink) iconShrink.style.display = "block";
      if (appContainer) appContainer.classList.add("compact-mode");
      document.body.classList.add("compact-body");
      
      // Programmatically resize Tauri OS window
      if (hasTauri) {
        try {
          const { getCurrentWindow } = window.__TAURI__.window;
          const { LogicalSize } = window.__TAURI__.dpi;
          const appWindow = getCurrentWindow();
          await appWindow.setSize(new LogicalSize(360, 520));
          await appWindow.setAlwaysOnTop(true);
        } catch (e) {
          log("WARN", "window", "Failed to resize Tauri window", e);
        }
      }
      log("INFO", "window", "switched to compact mode");
    } else {
      if (iconExpand) iconExpand.style.display = "block";
      if (iconShrink) iconShrink.style.display = "none";
      if (appContainer) appContainer.classList.remove("compact-mode");
      document.body.classList.remove("compact-body");
      
      // Restore Tauri OS window size
      if (hasTauri) {
        try {
          const { getCurrentWindow } = window.__TAURI__.window;
          const { LogicalSize } = window.__TAURI__.dpi;
          const appWindow = getCurrentWindow();
          await appWindow.setSize(new LogicalSize(1024, 768));
          await appWindow.setAlwaysOnTop(false);
        } catch (e) {
          log("WARN", "window", "Failed to restore Tauri window size", e);
        }
      }
      log("INFO", "window", "restored normal mode");
    }
  });
}

// Initial UI layout render
updateUi();

setup().catch((err) => {
  log("ERROR", "sysbus", "setup failed", { error: err });
});
