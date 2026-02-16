// Game State
const state = {
    money: 0,
    gridSize: 3,
    maxGridSize: 10,
    grid: [], // Will be initialized
    placementMode: false,
    selectedBuilding: null,
    totalIncomeRate: 0,
    isDragging: false, // New: Track drag state
    acquiredSkills: [], // New: Skill Tree
    acquiredSkills: [], // New: Skill Tree
    clickLevel: 1, // New: Click Upgrade Level
    clickLevel: 1, // New: Click Upgrade Level
    buildings: {

        factory_small: {
            id: 'factory_small',
            name: '町工場',
            cost: 100,
            baseIncome: 10,
            description: '基本の生産施設。隣接する町工場で効率UP。'
        },
        supply_depot: {
            id: 'supply_depot',
            name: '資材倉庫',
            cost: 500,
            baseIncome: 5,
            description: '隣接工場の生産性を1.2倍にする(重複可)。'
        },
        factory_large: {
            id: 'factory_large',
            name: 'ハイテク工場',
            cost: 2000,
            baseIncome: 80,
            description: '高収益施設。隣接する倉庫で大幅ボーナス。'
        },
        power_plant: {
            id: 'power_plant',
            name: '火力発電所',
            cost: 5000,
            baseIncome: 0,
            description: '全周囲施設の生産性を1.5倍にするが、寿命が短い。'
        }
    }
};

// Skill Data
// Skill Data
const skillData = [
    // Tier 1: Dawn of Industry
    {
        id: "tech_foundation",
        name: "基礎産業技術",
        description: "全ての収益 +5%。生産の基礎。",
        cost: 500,
        type: "Passive",
        exclusive_with: null,
        effects: { revenue_add_percent: 0.05 },
        children: ["logistics_1", "quality_control"]
    },
    {
        id: "logistics_1",
        name: "資材管理システム",
        description: "「資材倉庫」が建設可能になる。",
        cost: 1000,
        type: "Unlock",
        exclusive_with: null,
        effects: { unlock_building: "supply_depot" },
        children: ["mass_production"]
    },
    // Tier 2: Growth
    {
        id: "quality_control",
        name: "品質管理プロセス",
        description: "全施設の寿命が1.5倍になる。",
        cost: 2000,
        type: "Passive",
        exclusive_with: null,
        effects: { max_lifetime_mult: 1.5 },
        children: ["automated_maintenance"]
    },
    {
        id: "mass_production",
        name: "大量生産ライン",
        description: "「ハイテク工場」が建設可能になる。",
        cost: 3000,
        type: "Unlock",
        exclusive_with: null,
        effects: { unlock_building: "factory_large" },
        children: ["logistics_2"]
    },
    {
        id: "logistics_2",
        name: "物流最適化",
        description: "資材倉庫のバフ効果が強化される (1.2倍 -> 1.3倍)。",
        cost: 4000,
        type: "Passive",
        exclusive_with: null,
        effects: { depot_buff_mult: 1.3 }, // Custom effect logic needed
        children: ["power_grid"]
    },
    // Tier 3: Industrial Revolution
    {
        id: "power_grid",
        name: "電力網整備",
        description: "「火力発電所」が建設可能になる。",
        cost: 8000,
        type: "Unlock",
        exclusive_with: null,
        effects: { unlock_building: "power_plant" },
        children: ["overload_operation"]
    },
    {
        id: "automated_maintenance",
        name: "自動メンテナンス",
        description: "全施設の寿命減少速度を30%抑える。",
        cost: 6000,
        type: "Passive",
        exclusive_with: null,
        effects: { decay_rate_mult: 0.7 },
        children: []
    },
    {
        id: "overload_operation",
        name: "過負荷運転",
        description: "発電所の効果が2.0倍になるが、全施設の寿命減少が2倍速になる。",
        cost: 10000,
        type: "Active",
        exclusive_with: null,
        effects: { power_plant_buff: 2.0, decay_rate_mult: 2.0 },
        children: []
    }
];


// DOM Elements
// DOM Elements
let elements = {};

function initDomElements() {
    elements = {
        moneyDisplay: document.getElementById('money-display'),
        incomeRateDisplay: document.getElementById('income-rate-display'),
        grid: document.getElementById('grid'),
        workBtn: document.getElementById('work-btn'),
        expandBtn: document.getElementById('expand-btn'),
        buyFactorySmallBtn: document.getElementById('buy-factory-small-btn'),
        buySupplyDepotBtn: document.getElementById('buy-supply-depot-btn'),
        buyFactoryLargeBtn: document.getElementById('buy-factory-large-btn'),
        buyPowerPlantBtn: document.getElementById('buy-power-plant-btn'),
        statusMessage: document.getElementById('status-message'),

        // Skill UI
        researchBtn: document.getElementById('research-btn'),
        skillModal: document.getElementById('skill-modal'),
        closeSkillModalBtn: document.getElementById('close-skill-modal'),
        skillTreeContainer: document.getElementById('skill-tree-container'),
        resetSkillsBtn: document.getElementById('reset-skills-btn'),

        // Repair UI
        repairContainer: document.getElementById('repair-container'),
        repairBtn: document.getElementById('repair-btn'),
        repairCostDisplay: document.getElementById('repair-cost')
    };
}



// ... init ... (This part is fine, listener setup below needs update)

// ... Logic functions ...

// Skill System UI Logic

function openSkillModal() {
    renderSkillTree();
    elements.skillModal.classList.remove('hidden');
    elements.skillModal.style.display = 'flex';
}

function closeSkillModal() {
    elements.skillModal.classList.add('hidden');
    elements.skillModal.style.display = 'none';
}


function renderSkillTree() {
    elements.skillTreeContainer.innerHTML = '';

    // 1. Render Normal Skills
    skillData.forEach(skill => {
        const node = document.createElement('div');
        node.classList.add('skill-node');

        // Status classes
        const isAcquired = state.acquiredSkills.includes(skill.id);
        const isExcluded = isSkillExcluded(skill.id);
        const isAffordable = state.money >= skill.cost;
        const isUnlockable = isSkillUnlockable(skill.id);

        if (isAcquired) node.classList.add('acquired');
        if (isExcluded) node.classList.add('excluded');
        if (!isAcquired && !isUnlockable) node.classList.add('locked');

        // Inner HTML
        node.innerHTML = `
            <div class="type ${skill.type}">${skill.type}</div>
            <h3>${skill.name}</h3>
            <p>${skill.description}</p>
            <div class="cost">${isAcquired ? '習得済み' : (isExcluded ? '取得不可' : skill.cost + '¥')}</div>
        `;

        // Click Handler
        node.addEventListener('click', () => {
            if (isAcquired || isExcluded) return;
            if (!isUnlockable) {
                alert('前提スキルが未習得です。');
                return;
            }
            if (!isAffordable) {
                alert('お金が足りません。');
                return;
            }
            if (confirm(`${skill.name} を研究しますか？\n費用: ${skill.cost}¥`)) {
                purchaseSkill(skill.id);
            }
        });

        elements.skillTreeContainer.appendChild(node);
    });

    // 2. Render Training Section (Click Upgrade)
    const divider = document.createElement('div');
    divider.style.width = '100%';
    divider.style.borderTop = '1px solid #475569';
    divider.style.margin = '20px 0';
    elements.skillTreeContainer.appendChild(divider);

    const upgradeLabel = document.createElement('h3');
    upgradeLabel.textContent = "社員教育 (Click Power)";
    upgradeLabel.style.width = '100%';
    upgradeLabel.style.color = '#f8fafc';
    upgradeLabel.style.textAlign = 'center';
    elements.skillTreeContainer.appendChild(upgradeLabel);

    const trainingNode = document.createElement('div');
    trainingNode.classList.add('skill-node');
    trainingNode.style.borderColor = '#f59e0b'; // Gold border for special

    const clickCost = getClickUpgradeCost();
    const currentIncome = getClickIncome();
    const nextIncome = 50 * (state.clickLevel + 1);
    const canAfford = state.money >= clickCost;

    trainingNode.innerHTML = `
        <div class="type" style="background: #f59e0b; color: black;">Training</div>
        <h3>労働効率改善 Lv.${state.clickLevel}</h3>
        <p>クリック収益: ${currentIncome}¥ → ${nextIncome}¥</p>
        <div class="cost" style="color: ${canAfford ? '#f59e0b' : '#94a3b8'}">コスト: ${clickCost.toLocaleString()}¥</div>
    `;

    trainingNode.addEventListener('click', () => {
        if (canAfford) {
            handleClickUpgrade();
        } else {
            alert('資金が足りません。');
        }
    });

    elements.skillTreeContainer.appendChild(trainingNode);
}

function isSkillExcluded(skillId) {
    // Check if exclusive partner is acquired
    const skill = skillData.find(s => s.id === skillId);
    if (!skill || !skill.exclusive_with) return false;
    return state.acquiredSkills.includes(skill.exclusive_with);
}

function isSkillUnlockable(skillId) {
    if (skillId === 'tech_foundation') return true;

    // Find parent (very simple tree search for this flat data)
    // Who has this skill as child?
    const parent = skillData.find(s => s.children && s.children.includes(skillId));
    if (!parent) return false; // Should not happen for non-root

    return state.acquiredSkills.includes(parent.id);
}

function purchaseSkill(skillId) {
    const skill = skillData.find(s => s.id === skillId);
    if (spendMoney(skill.cost)) {
        state.acquiredSkills.push(skillId);
        renderSkillTree();
        updateDisplay();
        saveGame();
    }
}

function handleResetSkills() {
    const penalty = Math.floor(state.money * 0.1);
    if (confirm(`スキルをリセットしますか？\n所持金の10% (${penalty}円) が研究撤退費用として没収されます。`)) {
        state.money -= penalty;
        state.acquiredSkills = [];
        renderSkillTree();
        updateDisplay();
        saveGame();
        alert('スキルをリセットしました。');
    }
}


// ... getExpansionCost ...
// ... renderGrid etc ...

// Event Listeners Update
// Duplicate setupEventListeners removed


// Initialization - Moved to end


// ... init ... (Keep existing init but update it later if needed)

// Logic: Revenue Multiplier
function calculateRevenueMultiplier() {
    let multiplierAdd = 0;
    state.acquiredSkills.forEach(id => {
        const skill = skillData.find(s => s.id === id);
        if (skill && skill.effects.revenue_add_percent) {
            multiplierAdd += skill.effects.revenue_add_percent;
        }
    });
    return 1 + multiplierAdd;
}

// Logic: Failure Check
// Logic: Failure Check (Individual)
// Logic: Max Lifetime Multiplier
function getMaxLifetimeMultiplier() {
    let mult = 1.0;
    state.acquiredSkills.forEach(id => {
        const skill = skillData.find(s => s.id === id);
        if (skill && skill.effects.max_lifetime_mult) {
            mult *= skill.effects.max_lifetime_mult; // Multiply or Add? Usually multiply for "1.5x"
            // If strictly additive (1.5 + 2.0 = 3.5x), logical.
            // If multiplicative (1.5 * 2.0 = 3.0x), also fine.
            // Let's go with Max (replace) or Multiply. 
            // Since tree branches, probably separate. Let's use MAX if we want tiers, or Mult if stack.
            // Description says "1.5x", "2.0x". Let's assume they might stack or replace.
            // Let's simply take the highest multiplier if we want simple tiers, 
            // OR multiply them. Let's just use the highest value found for now to avoid exponential brokenness.
        }
    });
    // Actually, iterating to find max is better for "Tier 1", "Tier 2".
    let maxMult = 1.0;
    state.acquiredSkills.forEach(id => {
        const skill = skillData.find(s => s.id === id);
        if (skill && skill.effects.max_lifetime_mult) {
            if (skill.effects.max_lifetime_mult > maxMult) {
                maxMult = skill.effects.max_lifetime_mult;
            }
        }
    });
    return maxMult;
}

// Logic: Decay Rate Multiplier
function getDecayRateMultiplier() {
    let mult = 1.0;
    state.acquiredSkills.forEach(id => {
        const skill = skillData.find(s => s.id === id);
        if (skill && skill.effects.decay_rate_mult) {
            mult *= skill.effects.decay_rate_mult;
        }
    });
    return mult;
}

// Logic: Lifetime Update (Decay)
function updateBuildingStatus() {
    const decayMult = getDecayRateMultiplier();
    let statusChanged = false;

    // Base decay per tick (1 second) -> 1
    // Factory Max Lifetime = 100 -> 100 seconds (too short? maybe 300s = 5 min)
    // Let's set Factory Base Lifetime to 300 in placeBuilding.

    for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
            const building = state.grid[y][x];
            if (building) {
                // Only factories decay for now? Or everything?
                // Plan said "Factories mostly". Let's apply to factories only for gameplay balance.
                // Or apply to everything but parks/apartments have huge lifetime?
                // Let's stick to Factory for now as requested.
                if (building.id === 'factory') {
                    if (!building.isBroken) {
                        const decay = 1 * decayMult;
                        building.lifetime -= decay;

                        if (building.lifetime <= 0) {
                            building.lifetime = 0;
                            building.isBroken = true;
                            statusChanged = true;
                        }
                    }
                }
            }
        }
    }

    if (statusChanged) {
        saveGame();
        renderGrid();
        updateDisplay();
    }
}


// Logic: Max Offline Hours
function getMaxOfflineHours() {
    let hours = 24; // Base
    state.acquiredSkills.forEach(id => {
        const skill = skillData.find(s => s.id === id);
        if (skill && skill.effects.offline_duration_add_hours) {
            hours += skill.effects.offline_duration_add_hours;
        }
    });
    return hours;
}


function getExpansionCost() {
    // Simple progressive cost: e.g. 1000 * (currentSize - 2)^2
    // 3->4: 1000
    // 4->5: 4000
    // 5->6: 9000
    if (state.gridSize >= state.maxGridSize) return Infinity;
    const nextSize = state.gridSize - 2;
    return 1000 * (nextSize * nextSize);
}

// Rendering
function renderGrid() {
    if (!elements.grid) {
        console.error('Grid element not found!');
        return;
    }

    elements.grid.innerHTML = '';

    // Dynamic grid styling
    elements.grid.style.gridTemplateColumns = `repeat(${state.gridSize}, 100px)`;
    elements.grid.style.gridTemplateRows = `repeat(${state.gridSize}, 100px)`;

    // Calculate income for each cell to determine visuals
    let cellIncomes;
    try {
        cellIncomes = calculateCellIncomes();
    } catch (e) {
        console.error('Error calculating incomes:', e);
        // Fallback for display
        cellIncomes = Array(state.gridSize).fill().map(() => Array(state.gridSize).fill({ total: 0, bonus: 0, multiplier: 1 }));
    }

    for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;

            const building = state.grid[y][x];
            if (building) {
                cell.classList.add('filled');
                cell.classList.add(building.id); // 'apartment', 'park', 'factory'

                if (building.isBroken) cell.classList.add('broken');

                // Define icons
                let icon = '';
                if (building.id === 'factory_small') icon = '🔨';
                if (building.id === 'supply_depot') icon = '📦';
                if (building.id === 'factory_large') icon = '🏭';
                if (building.id === 'power_plant') icon = '⚡';
                // Legacy support (just in case)
                if (building.id === 'apartment') icon = '🏢';
                if (building.id === 'park') icon = '🌳';
                if (building.id === 'factory') icon = '🏭';

                // Content
                let contentHtml = `<div class="cell-icon">${icon}</div>`;

                // Income info
                const incomeInfo = cellIncomes[y][x];
                if (incomeInfo.total > 0 || incomeInfo.multiplier < 1) {
                    contentHtml += `<div class="income-indicator">${incomeInfo.total}</div>`;
                }

                cell.innerHTML = contentHtml;

                // Visual Effects
                if (incomeInfo.bonus > 0) {
                    cell.classList.add('bonus-active');
                }
                if (incomeInfo.multiplier < 1) {
                    cell.classList.add('negative-effect');
                }

                // Broken Visuals
                if (building.isBroken) {
                    cell.classList.add('broken');
                    contentHtml += `<div class="broken-overlay"><i class="fa-solid fa-triangle-exclamation"></i></div>`;
                }

                // Lifetime Bar
                if (building.maxLifetime && building.maxLifetime > 0) {
                    const pct = Math.max(0, Math.min(100, (building.lifetime / building.maxLifetime) * 100));
                    let colorClass = 'high';
                    if (pct < 50) colorClass = 'medium';
                    if (pct < 20) colorClass = 'low';

                    contentHtml += `
                        <div class="lifetime-bar-container">
                            <div class="lifetime-bar ${colorClass}" style="width: ${pct}%"></div>
                        </div>
                     `;
                }

                cell.innerHTML = contentHtml; // Re-set html properly

            } else {
                cell.textContent = '';
                // Add hover effect hint if in placement mode
                if (state.placementMode) {
                    cell.classList.add('placement-mode');
                }
            }

            // Mouse Events for Drag Building
            cell.addEventListener('mousedown', (e) => {
                // Only left click
                if (e.button === 0) {
                    if (state.placementMode) {
                        state.isDragging = true;
                        attemptBuild(x, y, false);
                    } else {
                        handleCellClick(x, y);
                    }
                }
            });

            cell.addEventListener('mouseenter', () => {
                if (state.isDragging) {
                    attemptBuild(x, y, true); // Treat as drag (skip confirm, skip occupied)
                }
            });

            elements.grid.appendChild(cell);
        }
    }
}


let lastDisplayState = {
    clickIncome: -1,
    gridSize: -1,
    expansionCost: -1,
    placementMode: null,
    selectedBuildingId: null
};



// Helper to check building unlock status
function isBuildingUnlocked(buildingId) {
    if (buildingId === 'factory_small') return true;

    if (buildingId === 'supply_depot') return state.acquiredSkills.includes('logistics_1');
    if (buildingId === 'factory_large') return state.acquiredSkills.includes('mass_production');
    if (buildingId === 'power_plant') return state.acquiredSkills.includes('power_grid');

    return true;
}

function updateShopButton(btn, id, cost, name) {
    if (!btn) return;
    const isUnlocked = isBuildingUnlocked(id);
    if (!isUnlocked) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.innerHTML = `<i class="fa-solid fa-lock"></i> <span class="btn-text">Locked</span>`;
        return;
    }
    btn.style.opacity = '1';
    // Text will be reset by setShopButtonState/resetShopButtonState if visible
}

// Helper to check building unlock status
function isBuildingUnlocked(buildingId) {
    if (buildingId === 'factory_small') return true;

    if (buildingId === 'supply_depot') return state.acquiredSkills.includes('logistics_1');
    if (buildingId === 'factory_large') return state.acquiredSkills.includes('mass_production');
    if (buildingId === 'power_plant') return state.acquiredSkills.includes('power_grid');

    return true;
}

function updateShopButton(btn, id, cost, name) {
    if (!btn) return;
    const isUnlocked = isBuildingUnlocked(id);
    if (!isUnlocked) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.innerHTML = `<i class="fa-solid fa-lock"></i> <span class="btn-text">Locked</span>`;
        return;
    }
    btn.style.opacity = '1';
    // Text and icon will be set by setShopButtonState/resetShopButtonState
}

function updateDisplay() {
    elements.moneyDisplay.textContent = state.money.toLocaleString();

    // Income Rate Display with Failure Warning
    elements.incomeRateDisplay.textContent = state.totalIncomeRate.toLocaleString();
    elements.incomeRateDisplay.classList.remove('failure-active');

    // Work Button - Only update if income changed
    const clickIncome = getClickIncome();
    if (clickIncome !== lastDisplayState.clickIncome) {
        elements.workBtn.innerHTML = `
            <div class="btn-content">
                <i class="fa-solid fa-coins"></i>
                <span>Work (+${clickIncome.toLocaleString()}¥)</span>
            </div>
        `;
        lastDisplayState.clickIncome = clickIncome;
    }

    // Expansion Button - Only update if specific conditions change
    const expCost = getExpansionCost();
    const canExpand = state.gridSize < state.maxGridSize;
    // We update if gridSize changed OR (expansion available AND cost changed - though cost depends on size so redundant)
    // Just check grid size usually enough, but let's be safe.
    if (state.gridSize !== lastDisplayState.gridSize) {
        if (canExpand) {
            elements.expandBtn.innerHTML = `<i class="fa-solid fa-expand"></i> Expand City (${state.gridSize}x${state.gridSize} → ${state.gridSize + 1}x${state.gridSize + 1}) : ${expCost.toLocaleString()}¥`;
        } else {
            elements.expandBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Max Size Reached';
        }
        lastDisplayState.gridSize = state.gridSize;
    }

    // Expansion Disabled State
    if (canExpand) {
        elements.expandBtn.disabled = state.money < expCost;
    } else {
        elements.expandBtn.disabled = true;
    }

    // Repair All Button Logic
    let totalRepairCost = 0;
    let brokenCount = 0;
    for (let row of state.grid) {
        for (let cell of row) {
            if (cell && cell.isBroken) {
                brokenCount++;
                totalRepairCost += getRepairCost(cell);
            }
        }
    }

    if (brokenCount > 0) {
        elements.repairContainer.classList.remove('hidden');
        elements.repairBtn.disabled = state.money < totalRepairCost;
        elements.repairCostDisplay.textContent = `(全${brokenCount}件 / 費用: ${totalRepairCost.toLocaleString()}¥)`;
    } else {
        elements.repairContainer.classList.add('hidden');
    }

    // Shop Buttons Logic
    // Shop Buttons Logic
    const smallCost = state.buildings.factory_small.cost;
    const depotCost = state.buildings.supply_depot.cost;
    const largeCost = state.buildings.factory_large.cost;
    const powerCost = state.buildings.power_plant.cost;

    updateShopButton(elements.buyFactorySmallBtn, 'factory_small', smallCost, 'Small Factory');
    updateShopButton(elements.buySupplyDepotBtn, 'supply_depot', depotCost, 'Supply Depot');
    updateShopButton(elements.buyFactoryLargeBtn, 'factory_large', largeCost, 'High-Tech Factory');
    updateShopButton(elements.buyPowerPlantBtn, 'power_plant', powerCost, 'Power Plant');

    // Update visuals only on mode/selection change
    const currentBuildingId = state.selectedBuilding ? state.selectedBuilding.id : null;

    if (state.placementMode !== lastDisplayState.placementMode || currentBuildingId !== lastDisplayState.selectedBuildingId) {

        if (state.placementMode) {
            showStatus('設置場所を選択してください... (キャンセルはボタンを再クリック)');

            if (isBuildingUnlocked('factory_small')) setShopButtonState(elements.buyFactorySmallBtn, 'factory_small', smallCost, 'Small Factory');
            if (isBuildingUnlocked('supply_depot')) setShopButtonState(elements.buySupplyDepotBtn, 'supply_depot', depotCost, 'Supply Depot');
            if (isBuildingUnlocked('factory_large')) setShopButtonState(elements.buyFactoryLargeBtn, 'factory_large', largeCost, 'High-Tech Factory');
            if (isBuildingUnlocked('power_plant')) setShopButtonState(elements.buyPowerPlantBtn, 'power_plant', powerCost, 'Power Plant');

            document.body.style.cursor = 'cell';
        } else {
            hideStatus();
            if (isBuildingUnlocked('factory_small')) resetShopButtonState(elements.buyFactorySmallBtn, smallCost, 'Small Factory', 'fa-industry');
            if (isBuildingUnlocked('supply_depot')) resetShopButtonState(elements.buySupplyDepotBtn, depotCost, 'Supply Depot', 'fa-warehouse');
            if (isBuildingUnlocked('factory_large')) resetShopButtonState(elements.buyFactoryLargeBtn, largeCost, 'High-Tech Factory', 'fa-city');
            if (isBuildingUnlocked('power_plant')) resetShopButtonState(elements.buyPowerPlantBtn, powerCost, 'Power Plant', 'fa-bolt');
            document.body.style.cursor = 'default';
        }

        lastDisplayState.placementMode = state.placementMode;
        lastDisplayState.selectedBuildingId = currentBuildingId;
    }
}


function setShopButtonState(btn, id, cost, name) {
    if (state.selectedBuilding && state.selectedBuilding.id === id) {
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> <span class="btn-text">Cancel</span>`;
        btn.classList.add('cancel-mode');
    } else {
        // Find icon key or pass it? 
        // We need the icon key. 
        // Let's refactor to accept icon key OR determine it here.
        let icon = '';
        if (id === 'factory_small') icon = 'fa-industry';
        if (id === 'supply_depot') icon = 'fa-warehouse';
        if (id === 'factory_large') icon = 'fa-city';
        if (id === 'power_plant') icon = 'fa-bolt';

        resetShopButtonState(btn, cost, name, icon);
    }
}

function resetShopButtonState(btn, cost, name, iconKey) {
    btn.innerHTML = `<i class="fa-solid ${iconKey}"></i> <span class="btn-text">${name}</span> <span class="btn-cost">${cost.toLocaleString()}¥</span>`;
    btn.classList.remove('cancel-mode');
}


function showStatus(msg) {
    elements.statusMessage.textContent = msg;
    elements.statusMessage.classList.add('visible');
    elements.statusMessage.classList.remove('hidden');
}

function hideStatus() {
    elements.statusMessage.classList.remove('visible');
    elements.statusMessage.classList.add('hidden');
}

// Logic
function calculateCellIncomes_OLD() {
    const incomes = [];
    let grandTotal = 0;

    // Skill Multiplier
    const skillMultiplier = calculateRevenueMultiplier();

    for (let y = 0; y < state.gridSize; y++) {
        const row = [];
        for (let x = 0; x < state.gridSize; x++) {
            const building = state.grid[y][x];
            let cellData = { base: 0, bonus: 0, multiplier: 1, total: 0 };

            if (building) {
                cellData.base = building.baseIncome;

                // Neighbor Logic
                const adjacentOffsets = [
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                ];

                for (const offset of adjacentOffsets) {
                    const nx = x + offset.dx;
                    const ny = y + offset.dy;

                    if (nx >= 0 && nx < state.gridSize && ny >= 0 && ny < state.gridSize) {
                        const neighbor = state.grid[ny][nx];
                        if (neighbor && !neighbor.isBroken) {
                            // Apartment Synergies

                            if (building.id === 'apartment') {
                                if (neighbor.id === 'park') {
                                    cellData.bonus += 10;
                                }
                                if (neighbor.id === 'factory') {
                                    cellData.multiplier *= 0.5; // Halve income
                                }
                            }
                            // Factory Synergies
                            if (building.id === 'factory') {
                                if (neighbor.id === 'factory') {
                                    cellData.bonus += 50;
                                }
                            }
                        }
                    }
                }

                // Base Gain
                let rawTotal = (cellData.base + cellData.bonus) * cellData.multiplier;

                // Broken Penalty: ZERO INCOME
                if (building.isBroken) {
                    // Logic: If broken, it yields 0 and provides 0 synergy?
                    // Implementation Plan said: Broken = 0, and no synergy.
                    // Synergy is calculated above based on neighbors. 
                    // This function iterates structure. "cellData" is for THIS building.
                    // Neighbor effects are applied TO this building FROM neighbors.
                    // If a neighbor is broken, should it provide bonus?
                    // We need to check neighbor.isBroken in the loop above.

                    // BUT for THIS building's output:
                    rawTotal = 0;
                }

                // Apply Skill Multiplier (Only if not broken, but 0 * X is 0)
                rawTotal *= skillMultiplier;

                cellData.total = Math.floor(rawTotal);


            }
            row.push(cellData);
            grandTotal += cellData.total;
        }
        incomes.push(row);
    }

    state.totalIncomeRate = grandTotal;
    return incomes;
}

function calculateCellIncomes_BROKEN() {
    let total = 0;

    // Global Skill Multipliers
    const baseMult = calculateRevenueMultiplier();

    // Specific Buffs
    // Check if skills exist in array safe way
    const hasLogistics2 = state.acquiredSkills && state.acquiredSkills.includes('logistics_2');
    const hasOverload = state.acquiredSkills && state.acquiredSkills.includes('overload_operation');

    const depotBuffMult = hasLogistics2 ? 1.3 : 1.2;
    const powerBuffMult = hasOverload ? 2.0 : 1.5;

    for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
            const building = state.grid[y][x];
            if (building) {
                if (building.isBroken) {
                    continue; // 0 income
                }

                let base = building.baseIncome;
                let multiplier = 1.0;

                // Neighbor Synergy
                const neighbors = getNeighbors(x, y);

                neighbors.forEach(nb => {
                    const nbBuilding = state.grid[nb.y][nb.x];
                    if (nbBuilding && !nbBuilding.isBroken) {

                        // Factory Small Synergy: +5 per adjacent Small Factory
                        if (building.id === 'factory_small' && nbBuilding.id === 'factory_small') {
                            base += 5;
                        }

                        // Supply Depot Synergy: Multiplier for Factories
                        if (nbBuilding.id === 'supply_depot') {
                            if (building.id === 'factory_small' || building.id === 'factory_large') {
                                multiplier *= depotBuffMult;
                            }
                        }

                        // Just-In-Time (Large Factory): Bonus from Depot (Flat)
                        if (building.id === 'factory_large' && nbBuilding.id === 'supply_depot') {
                            base += 40;
                        }

                        // Power Plant Synergy: Multiplier for ALL
                        if (nbBuilding.id === 'power_plant') {
                            multiplier *= powerBuffMult;
                        }
                    }
                });

                // Apply Multiplier
                let finalIncome = base * multiplier;

                // Apply Global Skill
                finalIncome *= baseMult;

                total += finalIncome;
            }
        }
    }

    state.totalIncomeRate = Math.floor(total);
    updateDisplay();
}

// Helper: Get Neighbors safely
function getNeighbors(x, y) {
    const neighbors = [];
    const offsets = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
    ];

    offsets.forEach(offset => {
        const nx = x + offset.dx;
        const ny = y + offset.dy;
        if (nx >= 0 && nx < state.gridSize && ny >= 0 && ny < state.gridSize) {
            neighbors.push({ x: nx, y: ny });
        }
    });

    return neighbors;
}

function calculateCellIncomes() {
    let total = 0;
    const incomes = [];

    // Global Skill Multipliers
    const baseMult = calculateRevenueMultiplier();

    // Specific Buffs
    // Check if skills exist in array safe way
    const hasLogistics2 = state.acquiredSkills && state.acquiredSkills.includes('logistics_2');
    const hasOverload = state.acquiredSkills && state.acquiredSkills.includes('overload_operation');

    const depotBuffMult = hasLogistics2 ? 1.3 : 1.2;
    const powerBuffMult = hasOverload ? 2.0 : 1.5;

    for (let y = 0; y < state.gridSize; y++) {
        const row = [];
        for (let x = 0; x < state.gridSize; x++) {
            const building = state.grid[y][x];
            let cellData = { base: 0, bonus: 0, multiplier: 1, total: 0 };

            if (building) {
                if (building.isBroken) {
                    row.push(cellData);
                    continue; // 0 income
                }

                let base = building.baseIncome;
                let multiplier = 1.0;

                // Neighbor Synergy
                const neighbors = getNeighbors(x, y);

                neighbors.forEach(nb => {
                    const nbBuilding = state.grid[nb.y][nb.x];
                    if (nbBuilding && !nbBuilding.isBroken) {

                        // Factory Small Synergy: +5 per adjacent Small Factory
                        if (building.id === 'factory_small' && nbBuilding.id === 'factory_small') {
                            base += 5;
                        }

                        // Supply Depot Synergy: Multiplier for Factories
                        if (nbBuilding.id === 'supply_depot') {
                            if (building.id === 'factory_small' || building.id === 'factory_large') {
                                multiplier *= depotBuffMult;
                            }
                        }

                        // Just-In-Time (Large Factory): Bonus from Depot (Flat)
                        if (building.id === 'factory_large' && nbBuilding.id === 'supply_depot') {
                            base += 40;
                        }

                        // Power Plant Synergy: Multiplier for ALL
                        if (nbBuilding.id === 'power_plant') {
                            multiplier *= powerBuffMult;
                        }
                    }
                });

                // Apply Multipliers
                let finalIncome = base * multiplier;
                finalIncome *= baseMult;

                // Visual data
                cellData.base = base;
                cellData.multiplier = multiplier; // Store raw multiplier for display logic if needed
                // Actually, renderGrid checks multiplier < 1. 
                // But generally 1.0 is default.

                cellData.total = Math.floor(finalIncome);
                if (base > building.baseIncome) cellData.bonus = base - building.baseIncome;

                total += cellData.total;
            }
            row.push(cellData);
        }
        incomes.push(row);
    }

    state.totalIncomeRate = Math.floor(total);
    updateDisplay();
    return incomes;
}

function addMoney(amount) {
    state.money += amount;
    updateDisplay();
}

function spendMoney(amount) {
    if (state.money >= amount) {
        state.money -= amount;
        updateDisplay();
        return true;
    }
    return false;
}


function getClickIncome() {
    return 50 * (state.clickLevel || 1);
}

function getClickUpgradeCost() {
    // Progressive cost: 500 * 1.5^(level)
    const level = state.clickLevel || 1;
    return Math.floor(500 * Math.pow(1.5, level));
}

function handleClickUpgrade() {
    const cost = getClickUpgradeCost();
    // No confirmation needed for simple upgrade
    if (spendMoney(cost)) {
        state.clickLevel = (state.clickLevel || 1) + 1;
        saveGame();
        renderSkillTree();
        updateDisplay();
    } else {
        alert('資金が足りません。');
    }
}

function handleWork() {
    addMoney(getClickIncome());
}




function handleExpand() {
    const cost = getExpansionCost();
    if (state.gridSize < state.maxGridSize && spendMoney(cost)) {
        state.gridSize++;

        // Resize grid array: Add new column to existing rows, then add new row
        // 1. Add null to end of each existing row
        for (let row of state.grid) {
            row.push(null);
        }
        // 2. Create new row with size = new gridSize
        const newRow = [];
        for (let i = 0; i < state.gridSize; i++) {
            newRow.push(null);
        }
        state.grid.push(newRow);

        renderGrid();
        updateDisplay();
    }
}

function handleBuyBuilding(buildingId) {
    if (state.placementMode) {
        if (state.selectedBuilding.id === buildingId) {
            cancelPlacement();
            return;
        }
    }

    const building = state.buildings[buildingId];
    if (state.money >= building.cost) {
        state.placementMode = true;
        state.selectedBuilding = building;
        updateDisplay();
        renderGrid();
    } else {
        alert('お金が足りません！');
    }
}

function cancelPlacement() {
    stopPlacementMode();
}

function stopPlacementMode() {
    state.placementMode = false;
    state.selectedBuilding = null;
    state.isDragging = false;
    updateDisplay();
    renderGrid();
}

// Unify build logic
// isDragAction: true if called from mouseover/drag, false if direct click
function attemptBuild(x, y, isDragAction) {
    if (!state.placementMode || !state.selectedBuilding) {
        return;
    }

    const existingBuilding = state.grid[y][x];
    const newBuilding = state.selectedBuilding;

    if (existingBuilding === null) {
        // Case 1: Empty cell - Buy and Place
        // Check cost
        if (state.money >= newBuilding.cost) {
            spendMoney(newBuilding.cost);
            placeBuilding(x, y, newBuilding);
        } else {
            // If direct click, warn user. If dragging, just stop (or silently fail)
            if (!isDragAction) {
                alert('お金が足りません！');
            }
            // Optional: Stop dragging if money runs out?
            // state.isDragging = false;
        }
    } else {
        // Case 2: Existing building

        // If dragging, we SKIP existing buildings to avoid popup spam
        if (isDragAction) {
            return;
        }

        // Prevent same building type
        if (existingBuilding.id === newBuilding.id) {
            return;
        }

        if (state.money < newBuilding.cost) {
            alert('建て替え資金（新しい建物の費用）が足りません！');
            return;
        }

        const refundAmount = Math.floor(existingBuilding.cost / 2);
        const confirmMsg = `現在配置されている【${existingBuilding.name}】を取り壊して、新しい建物を建設しますか？\n(回収額: ${refundAmount}円)`;

        if (window.confirm(confirmMsg)) {
            addMoney(refundAmount);
            spendMoney(newBuilding.cost);
            placeBuilding(x, y, newBuilding);
        }
    }
}

function placeBuilding(x, y, buildingType) {
    const newBuilding = { ...buildingType };

    // Initialize Lifetime
    // Base Lifetime: Factory=300, Others=Infinite(999999)
    let baseMax = 300;
    if (newBuilding.id !== 'factory') baseMax = 999999;

    const mult = getMaxLifetimeMultiplier();
    newBuilding.maxLifetime = Math.floor(baseMax * mult);
    newBuilding.lifetime = newBuilding.maxLifetime;
    newBuilding.isBroken = false;

    state.grid[y][x] = newBuilding;

    // Do NOT stop placement mode if we want to allow continuous building!
    // But original req said "Mouse cursor becomes placement mode".
    // Usually clicker games keep tool active until right click or escape.
    // The previous logic called stopPlacementMode() after one click.
    // To support drag/continuous, we should keep it active.

    // HOWEVER, user requirement 2 said: "mouseup ... isDragging = false".
    // It implies we just stop dragging, but keep the tool selected?
    // "Mouse cursor becomes placement mode" -> usually persistent until cancelled.
    // Let's modify placeBuilding to NOT stop placement mode.

    renderGrid(); // Refresh to show new building
}


// Game Loop
function startGameLoop() {
    setInterval(() => {
        calculateCellIncomes();

        // Failure Logic (Lifetime Decay)
        updateBuildingStatus();


        updateDisplay();

        if (state.totalIncomeRate > 0) {
            addMoney(state.totalIncomeRate);
        }
    }, 1000);
}

function getRepairCost(building) {
    if (!building) return 0;
    // Repair cost is 20% of building cost
    return Math.floor(building.cost * 0.2);
}

function repairBuilding(x, y) {
    const building = state.grid[y][x];
    if (!building) return 0;
    // Repair cost is 20% of building cost
    return Math.floor(building.cost * 0.2);
}

function repairBuilding(x, y) {
    const building = state.grid[y][x];
    if (!building) return;

    // Allow repair if broken OR if lifetime is low (Preventive maintenance)?
    // User req: "Zero -> failure". 
    // Usually preventive repair is nice. Let's allow it if damaged.
    if (!building.isBroken && building.lifetime >= building.maxLifetime) return;

    const cost = getRepairCost(building);
    if (spendMoney(cost)) {
        building.isBroken = false;

        // Recalculate max lifetime based on CURRENT skills
        let baseMax = 300; // Base for factory
        if (building.id === 'apartment') baseMax = 999999; // Practically infinite
        if (building.id === 'park') baseMax = 999999;

        // Actually, we should store baseMax or calculate it dynamically.
        // Let's use the multiplier logic.
        const mult = getMaxLifetimeMultiplier();
        // Update maxLifetime property in case skill changed
        building.maxLifetime = Math.floor(baseMax * mult);

        building.lifetime = building.maxLifetime;

        renderGrid();
        updateDisplay();
        saveGame();
    } else {
        alert('修理費用が足りません！');
    }
}

function handleRepairAll() {
    let totalCost = 0;
    let targetCount = 0;

    // Calculate total cost for BROKEN buildings
    // Maybe we should only repair BROKEN ones with "Repair All"?
    // Or repair all damaged? "Repair All" usually implies fixing broken stuff.
    // Let's stick to isBroken for now to keep cost predictable.
    for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
            const building = state.grid[y][x];
            if (building && building.isBroken) {
                totalCost += getRepairCost(building);
                targetCount++;
            }
        }
    }

    if (targetCount === 0) return;

    if (spendMoney(totalCost)) {
        // Fix all broken
        const maxMult = getMaxLifetimeMultiplier();

        for (let y = 0; y < state.gridSize; y++) {
            for (let x = 0; x < state.gridSize; x++) {
                const building = state.grid[y][x];
                if (building && building.isBroken) {
                    building.isBroken = false;
                    let baseMax = 300;
                    if (building.id !== 'factory') baseMax = 999999;
                    building.maxLifetime = Math.floor(baseMax * maxMult);
                    building.lifetime = building.maxLifetime;
                }
            }
        }
        renderGrid();
        updateDisplay();
        saveGame();
        alert(`全ての施設を修理しました！(費用: ${totalCost.toLocaleString()}¥)`);
    } else {
        alert(`一括修理に必要な資金が足りません！(必要: ${totalCost.toLocaleString()}¥)`);
    }
}

function handleCellClick(x, y) {
    const building = state.grid[y][x];
    if (building && building.isBroken) {
        const cost = getRepairCost(building);
        if (confirm(`${building.name} を修理しますか？\n費用: ${cost.toLocaleString()}¥`)) {
            repairBuilding(x, y);
        }
    }
}

// Event Listeners
function setupEventListeners() {
    elements.workBtn.addEventListener('click', handleWork);
    elements.expandBtn.addEventListener('click', handleExpand);

    if (elements.buyFactorySmallBtn) elements.buyFactorySmallBtn.addEventListener('click', () => handleBuyBuilding('factory_small'));
    if (elements.buySupplyDepotBtn) elements.buySupplyDepotBtn.addEventListener('click', () => handleBuyBuilding('supply_depot'));
    if (elements.buyFactoryLargeBtn) elements.buyFactoryLargeBtn.addEventListener('click', () => handleBuyBuilding('factory_large'));
    if (elements.buyPowerPlantBtn) elements.buyPowerPlantBtn.addEventListener('click', () => handleBuyBuilding('power_plant'));

    // Global Mouse Up to stop dragging
    window.addEventListener('mouseup', () => {
        state.isDragging = false;
    });

    // Mouse Leave Grid (Safety)
    elements.grid.addEventListener('mouseleave', () => {
        state.isDragging = false;
    });

    // Reset Button
    document.getElementById('reset-btn').addEventListener('click', handleReset);

    // Skill UI Listeners
    if (elements.researchBtn) elements.researchBtn.addEventListener('click', openSkillModal);
    if (elements.closeSkillModalBtn) elements.closeSkillModalBtn.addEventListener('click', closeSkillModal);
    if (elements.resetSkillsBtn) elements.resetSkillsBtn.addEventListener('click', handleResetSkills);

    // Repair Listener
    if (elements.repairBtn) elements.repairBtn.addEventListener('click', handleRepairAll);

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.skillModal) {
            closeSkillModal();
        }
    });
    console.log("Setup Event Listeners Finished");
}

// Save & Load System
function saveGame() {
    const data = {
        money: state.money,
        gridSize: state.gridSize,
        grid: state.grid,
        acquiredSkills: state.acquiredSkills,
        clickLevel: state.clickLevel,
        isFailureActive: state.isFailureActive,
        lastSaveTime: Date.now()
    };
    localStorage.setItem('gridClickerSave', JSON.stringify(data));
}

function loadGame() {
    const json = localStorage.getItem('gridClickerSave');
    if (json) {
        try {
            const data = JSON.parse(json);

            // Validate basic structure
            if (data.money !== undefined && data.grid && data.gridSize) {
                state.money = data.money;
                state.gridSize = data.gridSize;
                state.grid = data.grid;
                state.acquiredSkills = data.acquiredSkills || [];
                state.clickLevel = data.clickLevel || 1;

                // MIGRATION: Remove old buildings
                if (state.grid) {
                    for (let y = 0; y < state.gridSize; y++) {
                        for (let x = 0; x < state.gridSize; x++) {
                            const cell = state.grid[y][x];
                            if (cell && ['apartment', 'park', 'factory'].includes(cell.id)) {
                                state.grid[y][x] = null;
                            }
                        }
                    }
                }

                // Return offline seconds
                if (data.lastSaveTime) {
                    const now = Date.now();
                    return Math.floor((now - data.lastSaveTime) / 1000);
                }
            }
        } catch (e) {
            console.error('Save file corrupted', e);
        }
    }
    return null;
}

function handleReset() {
    if (window.confirm('本当にデータをリセットして最初からやり直しますか？\n（この操作は取り消せません）')) {
        localStorage.removeItem('gridClickerSave');
        location.reload();
    }

}

// Initialization
function init() {
    try {
        console.log('Initializing Game...');
        initDomElements(); // Ensure DOM elements are grabbed

        // Verify critical elements
        if (!elements.grid || !elements.workBtn) {
            throw new Error('Critical DOM elements missing. Check HTML structure.');
        }

        // Try loading
        const offlineSeconds = loadGame();

        // Ensure state integrity
        if (!state.acquiredSkills) state.acquiredSkills = [];

        // Ensure valid grid size
        if (typeof state.gridSize !== 'number' || state.gridSize < 3 || state.gridSize > state.maxGridSize) {
            console.warn('Invalid gridSize detected, resetting to 3.');
            state.gridSize = 3;
            state.grid = []; // Force rebuild
        }

        if (offlineSeconds === null || !Array.isArray(state.grid) || state.grid.length !== state.gridSize) {
            // Initialize default grid state if no save found OR grid is corrupted
            console.log('Initializing or repairing grid...');
            state.grid = [];
            for (let y = 0; y < state.gridSize; y++) {
                const row = [];
                for (let x = 0; x < state.gridSize; x++) {
                    row.push(null); // null means empty
                }
                state.grid.push(row);
            }
        } else {
            // Deep check for row integrity AND patch legacy data
            for (let y = 0; y < state.gridSize; y++) {
                if (!Array.isArray(state.grid[y]) || state.grid[y].length !== state.gridSize) {
                    console.warn(`Row ${y} corrupted, fixing...`);
                    const newRow = [];
                    for (let x = 0; x < state.gridSize; x++) {
                        newRow.push(null);
                    }
                    state.grid[y] = newRow;
                }

                // Patch legacy buildings (missing lifetime)
                for (let x = 0; x < state.gridSize; x++) {
                    const cell = state.grid[y][x];
                    if (cell && (typeof cell.lifetime === 'undefined' || typeof cell.maxLifetime === 'undefined')) {
                        let baseMax = 300;
                        if (cell.id !== 'factory') baseMax = 999999;
                        // Use current multiplier for patching
                        // NOTE: At this point skills are loaded, so we can use multiplier.
                        // However, we need to call getMaxLifetimeMultiplier() but that depends on skillData 
                        // logic which is defined.
                        // Let's just default to base to avoid complex deps, or use 1.0. 
                        // Better to be safe.
                        cell.maxLifetime = baseMax; // Resetting to base might be annoyance but better than crash
                        cell.lifetime = baseMax;
                        cell.isBroken = false;
                    }
                }
            }
        }


        // First render & calc to establish current income rate
        renderGrid();
        updateDisplay();
        setupEventListeners();
        startGameLoop();

        // Process Offline Earnings
        if (offlineSeconds !== null && offlineSeconds > 0 && state.totalIncomeRate > 0) {
            const offlineIncome = state.totalIncomeRate * offlineSeconds;
            if (offlineIncome > 0) {
                addMoney(offlineIncome);

                // Format time display
                const hours = Math.floor(offlineSeconds / 3600);
                const minutes = Math.floor((offlineSeconds % 3600) / 60);
                const seconds = offlineSeconds % 60;

                let timeStr = '';
                if (hours > 0) timeStr += `${hours}時間 `;
                if (minutes > 0) timeStr += `${minutes}分 `;
                timeStr += `${seconds}秒`;

                // Use setTimeout to allow UI to render first
                setTimeout(() => {
                    alert(`おかえりなさい！\n不在の間に ${offlineIncome.toLocaleString()}円 の不労所得が発生しました。\n(放置時間: ${timeStr})`);
                }, 100);
            }
        }

        // Auto-Save every 5 seconds
        setInterval(saveGame, 5000);
        console.log('Game Initialized Successfully');

        // Force hide modal to prevent overlay issues
        if (elements.skillModal) {
            elements.skillModal.style.display = 'none';
        }

    } catch (e) {
        console.error('Initialization Error:', e);
        alert('ゲームの起動中にエラーが発生しました。\n' + e.message);
    }
}




// Start Game safely
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

