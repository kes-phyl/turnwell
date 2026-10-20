document.querySelectorAll('.plan').forEach((plan) => {
  const radio = plan.querySelector('input[type="radio"]');
  if (!radio) return;

  const select = () => {
    if (radio.checked) return;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  };

  plan.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    select();
  });
});
