import "./Button.css";

export function createNavButton({ text, onClick, active = false, disabled = false, className = '' }) {
  const btn = document.createElement("button");
  btn.className = `menu-nav-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`;
  btn.innerText = text.toUpperCase();
  btn.disabled = disabled;
  if (!disabled && onClick) {
    btn.addEventListener("click", onClick);
  }
  return btn;
}
