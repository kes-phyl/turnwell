const hover = window.matchMedia('(hover: hover) and (pointer: fine)');

document.querySelectorAll('.plan').forEach((plan) => {
  const details = plan.querySelector('details');
  if (!details) return;

  const sync = (open) => {
    if (plan.querySelector('input:checked')) {
      details.open = true;
      return;
    }
    details.open = open;
  };

  plan.addEventListener('mouseenter', () => {
    if (hover.matches) sync(true);
  });

  plan.addEventListener('mouseleave', () => {
    if (hover.matches) sync(false);
  });

  plan.querySelector('input')?.addEventListener('change', () => {
    document.querySelectorAll('.plan details').forEach((block) => {
      const card = block.closest('.plan');
      block.open = Boolean(card?.querySelector('input:checked'));
    });
  });
});
