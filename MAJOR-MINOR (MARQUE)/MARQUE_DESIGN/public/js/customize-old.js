(() => {
  const qs = new URLSearchParams(location.search);
  const model = qs.get('model') || 'Falcon S';
  const resumeIdx = qs.get('resume');

  const label = document.getElementById('model-label');
  if(label) label.textContent = `Model: ${model}`;

  const engineSel = document.getElementById('engine');
  const exhaustSel = document.getElementById('exhaust');
  const spoilerSel = document.getElementById('spoiler');
  const colorModeSel = document.getElementById('color-mode');
  const oneWrap = document.getElementById('one-tone');
  const twoWrap = document.getElementById('two-tone');
  const oneGrid = document.getElementById('one-swatches');
  const twoGrid = document.getElementById('two-swatches');
  const fabricSel = document.getElementById('fabric');
  const fabricGrid = document.getElementById('fabric-swatches');

  // Wait for options to load from database
  const waitForOptions = () => {
    return new Promise((resolve) => {
      const checkOptions = () => {
        if (MNS.engines.length > 0 && MNS.exhausts.length > 0 && MNS.spoilers.length > 0) {
          resolve();
        } else {
          setTimeout(checkOptions, 100);
        }
      };
      checkOptions();
    });
  };

  const initializeCustomizer = async () => {
    await waitForOptions();

    const engines = MNS.engines;
    const exhausts = MNS.exhausts;
    const spoilers = MNS.spoilers;
    const colors = MNS.colors.length > 0 ? MNS.colors : MNS.palette;
    const fabrics = MNS.fabrics.length > 0 ? MNS.fabrics : [{name: 'Leather'}, {name: 'Raxine'}, {name: 'Fabric'}];
    const twoCombos = MNS.twoToneCombos;

    // Populate selects
    engines.forEach(e => {
      const o = document.createElement('option');
      o.textContent = e.name || e;
      o.value = e.id || e;
      engineSel.appendChild(o);
    });

    exhausts.forEach(e => {
      const o = document.createElement('option');
      o.textContent = e.name || e;
      o.value = e.id || e;
      exhaustSel.appendChild(o);
    });

    spoilers.forEach(s => {
      const o = document.createElement('option');
      o.textContent = s.name || s;
      o.value = s.id || s;
      spoilerSel.appendChild(o);
    });

    fabrics.forEach(f => {
      const o = document.createElement('option');
      o.textContent = f.name || f;
      o.value = f.id || f;
      fabricSel.appendChild(o);
    });

    // One tone swatches (12)
    colors.forEach((c, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'swatch';
      d.style.background = c.hex || c.metadata ? JSON.parse(c.metadata).hex : '#000000';
      d.title = c.name || c;
      d.dataset.color = c.name || c;
      d.innerHTML = i < 9 ? `0${i+1}` : `${i+1}`;
      oneGrid.appendChild(d);
    });

    // Two tone combos (24 pairs)
    twoCombos.forEach((pair, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'swatch';
      const primaryColor = colors.find(p => p.name === pair[0]) || MNS.palette.find(p => p.name === pair[0]);
      const secondaryColor = colors.find(p => p.name === pair[1]) || MNS.palette.find(p => p.name === pair[1]);
      d.style.background = `linear-gradient(90deg, ${primaryColor?.hex || '#000000'} 50%, ${secondaryColor?.hex || '#ffffff'} 50%)`;
      d.title = `${pair[0]} + ${pair[1]}`;
      d.dataset.primary = pair[0];
      d.dataset.secondary = pair[1];
      d.textContent = i + 1;
      twoGrid.appendChild(d);
    });

    // Fabric color swatches (12)
    colors.forEach((c, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'swatch';
      d.style.background = c.hex || c.metadata ? JSON.parse(c.metadata).hex : '#000000';
      d.title = c.name || c;
      d.dataset.fabricColor = c.name || c;
      d.textContent = i + 1;
      fabricGrid.appendChild(d);
    });

    // Mode toggle
    const updateMode = () => {
      if(colorModeSel.value === 'one'){
        oneWrap.classList.remove('hidden');
        twoWrap.classList.add('hidden');
      } else {
        twoWrap.classList.remove('hidden');
        oneWrap.classList.add('hidden');
      }
    };
    colorModeSel.addEventListener('change', updateMode);
    updateMode();

    // Selection state
    const state = {
      model,
      engine: engines[0]?.id || engines[0],
      exhaust: exhausts[0]?.id || exhausts[0],
      spoiler: spoilers[0]?.id || spoilers[0],
      colorMode: 'one',
      colorPrimary: colors[0]?.name || colors[0],
      colorSecondary: colors[1]?.name || colors[1],
      fabric: fabrics[0]?.id || fabrics[0],
      fabricColor: colors[0]?.name || colors[0]
    };

    // Resume from favorites
    if(resumeIdx !== null){
      try {
        const currentUser = MNS.user.getCurrentUser();
        if (currentUser) {
          const favorites = await MNS.api.getFavorites(currentUser.id);
          const saved = favorites[Number(resumeIdx)];
          if(saved) {
            state.engine = saved.engine_id;
            state.exhaust = saved.exhaust_id;
            state.spoiler = saved.spoiler_id;
            state.colorMode = saved.color_mode;
            state.colorPrimary = saved.color_primary;
            state.colorSecondary = saved.color_secondary;
            state.fabric = saved.fabric_id;
            state.fabricColor = saved.fabric_color;
          }
        }
      } catch (error) {
        console.error('Failed to load saved configuration:', error);
      }
    }

    // Bind selects
    engineSel.value = state.engine;
    exhaustSel.value = state.exhaust;
    spoilerSel.value = state.spoiler;
    colorModeSel.value = state.colorMode;
    fabricSel.value = state.fabric;

  const selectOne = (grid, datasetKey, valueVal) => {
      grid.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
      const target = Array.from(grid.querySelectorAll('.swatch')).find(s => s.dataset && s.dataset[datasetKey] === valueVal);
      if(target) target.classList.add('selected');
    };

    // Initialize selections
    selectOne(oneGrid, 'color', state.colorPrimary);
    selectOne(twoGrid, 'primary', state.colorPrimary);
    selectOne(fabricGrid, 'fabricColor', state.fabricColor);

    // Events
    engineSel.addEventListener('change', () => state.engine = engineSel.value);
    exhaustSel.addEventListener('change', () => state.exhaust = exhaustSel.value);
    spoilerSel.addEventListener('change', () => state.spoiler = spoilerSel.value);
    fabricSel.addEventListener('change', () => state.fabric = fabricSel.value);

    oneGrid.addEventListener('click', e => {
      const btn = e.target.closest('.swatch');
      if(!btn) return;
      state.colorMode = 'one';
      colorModeSel.value = 'one';
      updateMode();
      state.colorPrimary = btn.dataset.color;
      selectOne(oneGrid, 'color', state.colorPrimary);
    });

    twoGrid.addEventListener('click', e => {
      const btn = e.target.closest('.swatch');
      if(!btn) return;
      state.colorMode = 'two';
      colorModeSel.value = 'two';
      updateMode();
      state.colorPrimary = btn.dataset.primary;
      state.colorSecondary = btn.dataset.secondary;
      selectOne(twoGrid, 'primary', state.colorPrimary);
    });

    fabricGrid.addEventListener('click', e => {
      const btn = e.target.closest('.swatch');
      if(!btn) return;
      state.fabricColor = btn.dataset.fabricColor;
      selectOne(fabricGrid, 'fabricColor', state.fabricColor);
    });

    document.getElementById('save-fav').addEventListener('click', async () => {
      try {
        const currentUser = MNS.user.getCurrentUser();
        if (!currentUser) {
          const name = prompt('Enter your name:');
          const email = prompt('Enter your email:');
          if (name && email) {
            const user = await MNS.user.ensureUser(name, email);
            state.userId = user.id;
          } else {
            alert('Name and email are required to save favorites');
            return;
          }
        }

        // Get car ID
        const cars = await MNS.api.getCars();
        const car = cars.find(c => c.name === model);
        if (!car) {
          alert('Car model not found');
          return;
        }

        // Calculate total price
        const engine = engines.find(e => (e.id || e) === state.engine);
        const exhaust = exhausts.find(e => (e.id || e) === state.exhaust);
        const spoiler = spoilers.find(s => (s.id || s) === state.spoiler);
        const fabric = fabrics.find(f => (f.id || f) === state.fabric);
        const primaryColor = colors.find(c => c.name === state.colorPrimary);
        const secondaryColor = colors.find(c => c.name === state.colorSecondary);

        const totalPrice = car.base_price + 
          (engine?.price || 0) + 
          (exhaust?.price || 0) + 
          (spoiler?.price || 0) + 
          (fabric?.price || 0) + 
          (primaryColor?.price || 0) + 
          (secondaryColor?.price || 0);

        const config = {
          engineId: state.engine,
          exhaustId: state.exhaust,
          spoilerId: state.spoiler,
          colorMode: state.colorMode,
          colorPrimary: state.colorPrimary,
          colorSecondary: state.colorSecondary,
          fabricId: state.fabric,
          fabricColor: state.fabricColor,
          totalPrice: totalPrice
        };

        await MNS.api.saveFavorite(currentUser.id, car.id, config);
        alert('Saved to favorites');
      } catch (error) {
        console.error('Failed to save favorite:', error);
        alert('Failed to save favorite. Please try again.');
      }
    });

    document.getElementById('go-checkout').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const currentUser = MNS.user.getCurrentUser();
        if (!currentUser) {
          const name = prompt('Enter your name:');
          const email = prompt('Enter your email:');
          if (name && email) {
            const user = await MNS.user.ensureUser(name, email);
            state.userId = user.id;
          } else {
            alert('Name and email are required for checkout');
            return;
          }
        }

        // Get car ID
        const cars = await MNS.api.getCars();
        const car = cars.find(c => c.name === model);
        if (!car) {
          alert('Car model not found');
          return;
        }

        // Calculate total price
        const engine = engines.find(e => (e.id || e) === state.engine);
        const exhaust = exhausts.find(e => (e.id || e) === state.exhaust);
        const spoiler = spoilers.find(s => (s.id || s) === state.spoiler);
        const fabric = fabrics.find(f => (f.id || f) === state.fabric);
        const primaryColor = colors.find(c => c.name === state.colorPrimary);
        const secondaryColor = colors.find(c => c.name === state.colorSecondary);

        const totalPrice = car.base_price + 
          (engine?.price || 0) + 
          (exhaust?.price || 0) + 
          (spoiler?.price || 0) + 
          (fabric?.price || 0) + 
          (primaryColor?.price || 0) + 
          (secondaryColor?.price || 0);

        const config = {
          engineId: state.engine,
          exhaustId: state.exhaust,
          spoilerId: state.spoiler,
          colorMode: state.colorMode,
          colorPrimary: state.colorPrimary,
          colorSecondary: state.colorSecondary,
          fabricId: state.fabric,
          fabricColor: state.fabricColor,
          totalPrice: totalPrice
        };

        // Store checkout data temporarily
        localStorage.setItem('mns_checkout', JSON.stringify({
          ...state,
          carId: car.id,
          carName: car.name,
          config: config
        }));

        location.href = '/checkout';
      } catch (error) {
        console.error('Failed to proceed to checkout:', error);
        alert('Failed to proceed to checkout. Please try again.');
      }
    });
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', initializeCustomizer);
})();



