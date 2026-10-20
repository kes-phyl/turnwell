const CARPET = {
  rug_small: 25,
  rug_medium: 45,
  rug_large: 75,
  fitted_room: 45,
  stairs: 55,
};

const DEEP = {
  studio: 150,
  '1bed': 160,
  '2bed': 210,
  '3bed': 265,
  '4bed': 320,
};

const EOT = {
  studio: 180,
  '1bed': 200,
  '2bed': 250,
  '3bed': 320,
  '4bed': 390,
};

const PLANS = {
  essential: { amount: 90, plan: 'Home Care Essential', visits: 2, hours: 2 },
  plus: { amount: 130, plan: 'Home Care Plus', visits: 3, hours: 2 },
};

function money(n) {
  return Math.round(Number(n) || 0);
}

export function estimateQuote(payload) {
  const service = payload.service;

  if (service === 'carpet') {
    if (payload.carpet_kind === 'rug') {
      const amount = CARPET[payload.rug_size];
      if (!amount) {
        return {
          status: 'need_price',
          label: 'Pick a size',
          note: 'Small, medium or large. That’s the ask.',
        };
      }
      return {
        status: 'requested',
        amount,
        label: `£${amount}`,
        note: 'Rug Doctor. Most stains come out. Professional standard.',
      };
    }
    if (payload.carpet_kind === 'fitted') {
      const rooms = Math.max(0, parseInt(payload.carpet_rooms, 10) || 0);
      const stairs = payload.include_stairs === 'yes';
      if (!rooms && !stairs) {
        return {
          status: 'need_price',
          label: 'Pick rooms',
          note: 'Each room is £45. Stairs are £55.',
        };
      }
      const amount = money(rooms * CARPET.fitted_room + (stairs ? CARPET.stairs : 0));
      return {
        status: 'requested',
        amount,
        label: `£${amount}`,
        note: 'We revive most carpets. Professional standard.',
      };
    }
    return {
      status: 'need_price',
      label: 'Rug or fitted?',
      note: 'Pick one, then a price.',
    };
  }

  if (service === 'deep' || service === 'end_of_tenancy') {
    const table = service === 'deep' ? DEEP : EOT;
    const amount = table[payload.property_size];
    if (!amount) {
      return {
        status: 'need_price',
        label: 'Pick a size',
        note: 'Each size has a starting price.',
      };
    }
    return {
      status: 'requested',
      amount,
      label: `£${amount}`,
      note: service === 'deep'
        ? 'A proper reset. We’ll take it from there.'
        : 'Thursday clean. Friday inventory. Messier houses are extra.',
    };
  }

  if (service === 'regular') {
    const matched = PLANS[payload.plan];
    if (matched) {
      return {
        status: 'requested',
        amount: matched.amount,
        plan: matched.plan,
        label: `£${matched.amount} / month`,
        note: `${matched.visits} visits a month. Kitchen, dishes, hoover.`,
      };
    }
    if (payload.plan === 'tailored') {
      return {
        status: 'requested',
        plan: 'Tailored Home Care',
        label: 'Tailored quote',
        note: 'We’ll price your hours and rooms after a look.',
      };
    }
    return {
      status: 'need_price',
      label: 'Pick a price',
      note: 'Choose Essential, Plus, or ask us to quote.',
    };
  }

  return {
    status: 'need_price',
    label: 'Pick a service',
    note: 'Choose what you want, then a price to ask for.',
  };
}

export function serializeEstimate(estimate) {
  return {
    status: estimate.status,
    amount: estimate.amount ?? null,
    label: estimate.label,
    plan: estimate.plan || '',
    note: estimate.note,
  };
}
