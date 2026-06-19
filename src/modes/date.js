// Date Calculation Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let calcType = "diff";

const dateFromEl = document.getElementById("date-from");
const dateToEl = document.getElementById("date-to");
const dateYearsEl = document.getElementById("date-years");
const dateMonthsEl = document.getElementById("date-months");
const dateDaysEl = document.getElementById("date-days");
const dateTotalDaysEl = document.getElementById("date-total-days");

function dateToTimestamp(dateStr) {
  return new Date(dateStr).getTime() / (1000 * 60 * 60 * 24);
}

async function calculateDateDiff() {
  if (!dateFromEl || !dateToEl) return;
  
  const fromStr = dateFromEl.value;
  const toStr = dateToEl.value;
  
  if (!fromStr || !toStr) return;
  
  const fromTs = Math.floor(dateToTimestamp(fromStr));
  const toTs = Math.floor(dateToTimestamp(toStr));
  
  const node = document.createElement("div");
  node.className = "request date-task";
  node.dataset.dateFrom = String(fromTs);
  node.dataset.dateTo = String(toTs);
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const totalDays = parseInt(style.getPropertyValue("--date-diff").trim()) || 0;
    
    const absDays = Math.abs(totalDays);
    const years = Math.floor(absDays / 365);
    const months = Math.floor((absDays % 365) / 30);
    const days = Math.floor((absDays % 365) % 30);
    
    if (dateYearsEl) dateYearsEl.textContent = String(years);
    if (dateMonthsEl) dateMonthsEl.textContent = String(months);
    if (dateDaysEl) dateDaysEl.textContent = String(days);
    if (dateTotalDaysEl) dateTotalDaysEl.textContent = String(absDays);
    
    node.remove();
    log("INFO", "date-alu", `date diff: ${totalDays} days`);
  }, 100);
}

export function initDateMode() {
  if (dateFromEl) dateFromEl.addEventListener("change", calculateDateDiff);
  if (dateToEl) dateToEl.addEventListener("change", calculateDateDiff);
  
  document.querySelectorAll("#date-calc-type .date-type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      calcType = btn.dataset.type;
      document.querySelectorAll("#date-calc-type .date-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      log("INFO", "date-mode", `calculation type set to: ${calcType}`);
    });
  });
  
  if (dateFromEl) {
    const today = new Date();
    dateFromEl.value = today.toISOString().split("T")[0];
  }
  if (dateToEl) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    dateToEl.value = nextYear.toISOString().split("T")[0];
  }
  
  calculateDateDiff();
  log("INFO", "date-mode", "date calculation mode initialized");
}
