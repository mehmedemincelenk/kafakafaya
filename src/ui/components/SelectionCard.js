export function createSelectionCard({ title, description, active, onClick, badge = '', className = '', disabled = false }) {
  const card = document.createElement("div");
  card.className = `selection-card ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`;

  if (badge) {
    const badgeEl = document.createElement("span");
    badgeEl.className = "card-badge";
    badgeEl.innerText = badge;
    card.appendChild(badgeEl);
  }

  const indicator = document.createElement("div");
  indicator.className = "card-active-indicator";
  card.appendChild(indicator);

  const content = document.createElement("div");
  content.className = "card-content";

  const t = document.createElement("h3");
  t.className = "card-title";
  t.innerText = title.toUpperCase();
  content.appendChild(t);

  if (description) {
    const d = document.createElement("p");
    d.className = "card-description";
    d.innerText = description.toUpperCase();
    content.appendChild(d);
  }

  card.appendChild(content);

  if (!disabled && onClick) {
    card.addEventListener("click", onClick);
  }
  return card;
}
