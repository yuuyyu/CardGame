// ===============================
// CONSTANTES
// ===============================
const BOARD_ROWS = 3
const BOARD_COLS = 3
const BOARD_SIZE = BOARD_ROWS * BOARD_COLS
// ===============================
// GRID HELPERS
// ===============================
function getRow(index){
  return Math.floor(index / BOARD_COLS)
}

function getColumn(index){
  return index % BOARD_COLS
}

function getIndex(row,col){
  return row * BOARD_COLS + col
}
// ===============================
// CLASSES
// ===============================
let magicAnimations = []
let rowEffects = []

class Card {
  constructor(data){
    Object.assign(this, data)
    this.currentHp = this.hp || null
    if(this.type === "combat"){
      this.mana = 0
    }
    // efeitos
    this.status = {
      burn:0,
      shock:0,
      freeze:0
    }
  }
}

class Player {
  constructor(name){
    this.name = name
    this.board = Array(BOARD_SIZE).fill(null)
    this.hand = []
    this.castle = null
    this.hasDragon = false
	
    this.isFirstTurn = true
    this.hasPlayedOpeningCard = false

    this.hasPlacedCombatThisTurn = false
    this.hasPlacedMagicThisTurn = false
  }
}
// ===============================
// VARIÁVEIS
// ===============================
let players = [
  new Player("Jogador 1"),
  new Player("Jogador 2")
]

let currentPlayer = 0
// ===============================
// CASTELOS
// ===============================

const castles = {
gelo:{
  name: "Castelo de Gelo",
  type: "castle",
  castleType: "ice",
  hp: 50
},
concreto:{
  name: "Castelo de Concreto",
  type: "castle",
  castleType: "concrete",
  hp: 60
},
areia:{
  name: "Castelo de Areia",
  type: "castle",
  castleType: "sand",
  hp: 40
}
}
// ===============================
// EFEITOS DE MAGIA
// ===============================
const magicEffects = {
  flameMeteor(target, damage, casterPlayer){
    // dano imediato
    target.currentHp -= damage

    // efeito secundário: vulnerabilidade
    // vamos armazenar quem aplicou e quantos turnos faltam
    target.status.burn = {
      remainingTurns: 2, // termina no final do próximo turno do caster
      casterPlayer: casterPlayer
    }
  },

  blizzard(target, damage){
    target.currentHp -= damage
    target.status.freeze = 1
  },

  thunderStorm(target, damage){
    target.currentHp -= damage
    target.status.shock = Math.round(damage * 0.5)
  },

  tornado(target, damage, enemyBoard, slotIndex){
    target.currentHp -= damage
    pushRowBack(enemyBoard, slotIndex)
  }
}
// ===============================
// MANA
// ===============================
function getManaCost(card) {

  switch(card.name) {

    case "Guerreiro":
      return 1

    case "Arqueiro":
      return 2

    case "Mago":
      return 3

    case "Dragao":
      return 3

    default:
      return 1
  }

}
function addManaToCards(player) {

  player.board.forEach(card => {

    if(card && card.type === "combat"){
      card.mana += 1
    }
  })
}
// ===============================
// CARTAS DE COMBATE
// ===============================

const combatCards = [
  { name:"Guerreiro", type:"combat", hp:40, attack:10, range:1 },
  { name:"Arqueiro",  type:"combat", hp:20, attack:5,  range:3 },
  { name:"Mago",      type:"combat", hp:10, attack:15, range:2 },
  { name:"Dragão",    type:"combat", hp:80, attack:20, range:2 }
]  
  const magicCards = [
	{
	name: "Meteoro de Chamas",
	type: "magic",
	subtype: "damage",
	element: "fogo",
	effect: "flameMeteor",
	attack: 4,	
	},
	{
	name: "Nevasca",
	type: "magic",
	subtype: "damage",
	element: "gelo",
	effect: "blizzard",
	attack: 2,	
	},
	{
	name: "Trovejada",
	type: "magic",
	subtype: "damage",
	element: "relampago",
	effect: "thunderStorm",
	attack: 4,	
	},
	{
	name: "Tornado",
	type: "magic",
	subtype: "damage",
	element: "vento",
	effect: "tornado",
	attack: 3,	
	},
	{
	name: "Distante",
	type: "magic",
	subtype: "buff",
	effect: "rangeBuff",
	duration: 3
	},
	{
	name: "Power Up",
	type: "magic",
	subtype: "buff",
	effect: "powerUp",
	duration: 2
	},
	{
	name: "Muralha",
	type: "magic",
	subtype: "buff",
	effect: "wall",
	duration: 2
	}
]
// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  init()
})

// ===============================
// INÍCIO DO JOGO
// ===============================

let selectingPlayer = 0;

function init() {
  const confirmBtn = document.getElementById("confirmCastleBtn");
  if(confirmBtn){
    confirmBtn.addEventListener("click", confirmCastleChoice);
    console.log("Listener do botão confirmar registrado");
  } else {
    console.error("Botão de confirmar castelo não encontrado no DOM");
  }

  const endTurnBtn = document.getElementById("endTurnBtn");
  if(endTurnBtn){
    endTurnBtn.addEventListener("click", endTurn);
  }
}

function startGame() {
  players.forEach(p=>{
    for(let i=0;i<5;i++) drawCard(p)
  })
  render()
}

// ===============================
// COMPRA DE CARTA
// ===============================

function drawCard(player){

  let randomTypeRoll = Math.random();

  let cardData;

  // =========================
  // 60% COMBATE
  // =========================
  if(randomTypeRoll < 0.6){

    let combatRoll = Math.random();

    if(combatRoll < 0.32){
      cardData = combatCards.find(c => c.name === "Guerreiro");
    }
    else if(combatRoll < 0.64){
      cardData = combatCards.find(c => c.name === "Arqueiro");
    }
    else if(combatRoll < 0.96){
      cardData = combatCards.find(c => c.name === "Mago");
    }
    else{
      // 4% Dragão
      if(player.hasDragon){
        // se já tem dragão, substitui por guerreiro
        cardData = combatCards.find(c => c.name === "Guerreiro");
      } else {
        cardData = combatCards.find(c => c.name === "Dragão");
      }
    }

  }

  // =========================
  // 30% MÁGICA
  // =========================
  else{

    const randomIndex =
      Math.floor(Math.random() * magicCards.length);

    cardData = magicCards[randomIndex];
  }

  let card = new Card(cardData);

  if(card.name === "Dragão"){
    player.hasDragon = true;
  }

  card.currentHp = card.hp;

  player.hand.push(card);
}

// ===============================
// RENDER
// ===============================
function render() {

  const container = document.getElementById("gameContainer")
  const handDiv = document.getElementById("hand")

  container.innerHTML = ""
  handDiv.innerHTML = ""

  document.getElementById("turnIndicator").innerText =
    "Turno: " + players[currentPlayer].name

  function createRow(playerIndex, start) {

    const row = document.createElement("div")
    row.className = "slotRow"

    for (let i = 0; i < 3; i++) {

      const slotIndex = start + i
      const slot = document.createElement("div")
      slot.className = "slot"
      slot.id = `slot-${playerIndex}-${slotIndex}`

      // ==========================
      // CARTA NO SLOT
      // ==========================
      const card = players[playerIndex].board[slotIndex]

      // ==========================
      // COR DA CARTA / STATUS
      // ==========================
      let statusColor = null
      if (card && card.type === "combat") {
        statusColor = getCardStatusColor(card) // vermelho, azul, roxo
      }

      // ==========================
      // COR DO ROW EFFECT
      // ==========================
      const rowNumber = getRow(slotIndex)
      const rowEffect = rowEffects.find(
        e => e.playerIndex === playerIndex && e.row === rowNumber
      )
      let rowColor = rowEffect ? (rowEffect.color || rowEffect.effect) : null

      // ==========================
      // PRIORIDADE: status da carta > rowEffect > vazio
      // ==========================
      if (statusColor) slot.style.backgroundColor = statusColor
      else if (rowColor) slot.style.backgroundColor = rowColor
      else slot.style.backgroundColor = ""

      // ==========================
      // HTML da carta
      // ==========================
      if (card) {

        if (card.type === "magic") {
          slot.classList.add("magicCard")
          if (card.subtype === "buff") slot.classList.add("buffCard")
        }

        let html = `${card.name}<br>`

        if (card.type === "combat") {
          html += `ATK:${card.attack}<br>`
          html += `RNG:${card.range}<br>`
          html += `HP:${card.currentHp}<br>`
          html += `MANA:${card.mana}`
        } else if (card.type === "magic" && card.subtype === "damage") {
          html += `ATK:${card.attack}`
        } else if (card.type === "magic" && card.subtype === "buff") {
          if (card.effect === "rangeBuff") html += `+1 RNG<br>`
          else if (card.effect === "powerUp") html += `+50% ATK<br>`
          else if (card.effect === "wall") html += `-50% DMG<br>`
          else html += `Buff<br>`
          html += `Turnos:${card.turnsRemaining}`
        } else if (card.type === "castle") {
          html += `HP:${card.currentHp}`
        }

        slot.innerHTML = html
      }

      slot.onclick = () => handleSlotClick(playerIndex, slotIndex)
      row.appendChild(slot)
    }

    return row
  }

  // ===== JOGADOR 2 =====
  container.appendChild(createRow(1, 6)) // Torre
  container.appendChild(createRow(1, 3)) // Retaguarda
  container.appendChild(createRow(1, 0)) // Frente

  const hr = document.createElement("hr")
  container.appendChild(hr)

  // ===== JOGADOR 1 =====
  container.appendChild(createRow(0, 0)) // Frente
  container.appendChild(createRow(0, 3)) // Retaguarda
  container.appendChild(createRow(0, 6)) // Torre

  // ===== MÃO =====
  players[currentPlayer].hand.forEach((card, index) => {

    const cardDiv = document.createElement("div")
    cardDiv.className = "handCard"

    if (index === selectedCardIndex) cardDiv.classList.add("selectedCard")
    if (card.type === "magic") {
      cardDiv.classList.add("magicCard")
      if (card.subtype === "buff") cardDiv.classList.add("buffCard")
    }

    let html = `${card.name}<br>`
    if (card.type === "combat") {
      html += `ATK:${card.attack}<br>`
      html += `RNG:${card.range}<br>`
      html += `HP:${card.hp}<br>`
      html += `ManaAtk:${getManaCost(card)}`
    } else if (card.type === "magic" && card.subtype === "damage") {
      html += `ATK:${card.attack}`
    } else if (card.type === "magic" && card.subtype === "buff") {
      if (card.effect === "rangeBuff") html += `+1 RNG<br>`
      else if (card.effect === "powerUp") html += `+50% ATK<br>`
      else if (card.effect === "wall") html += `-50% DMG<br>`
      else html += `Buff<br>`
      html += `Turnos:${card.duration}`
    }

    cardDiv.innerHTML = html

    cardDiv.onclick = () => {
      selectedCardIndex = (selectedCardIndex === index) ? null : index
      render()
    }

    handDiv.appendChild(cardDiv)
  })
}
// ===============================
// TURNO
// ===============================
async function endTurn(){

  const player = players[currentPlayer]

  resolveCombatPhase(currentPlayer)

  resolveMagicEffects(currentPlayer)

  await playMagicAnimations()

  applyMagicDamage()

  applyStatusEffects(currentPlayer)

  render()

  while(player.hand.length < 5){
    drawCard(player)
  }

  player.hasPlacedCombatThisTurn = false
  player.hasPlacedMagicThisTurn = false

  currentPlayer = 1 - currentPlayer

  addManaToCards(players[currentPlayer])
  updateRowEffects()
  render()
}
function updateRowEffects(){
  rowEffects.forEach(e => e.turnsRemaining--)
  rowEffects = rowEffects.filter(e => e.turnsRemaining > 0)
}
let selectedCardIndex = null

function placeCard(slotIndex){
  const player = players[currentPlayer]

  if(selectedCardIndex === null){
    alert("Selecione uma carta da mão primeiro.")
    return
  }

  const card = player.hand[selectedCardIndex]
  const slotCard = player.board[slotIndex]

  // Carta de combate
  if(card.type === "combat"){
    if(slotCard) return // não pode sobrepor
    player.board[slotIndex] = card
    card.mana = 0
  }
  // Carta mágica de ataque
  else if(card.type === "magic" && card.subtype === "damage"){
    // Só adiciona no tabuleiro do jogador, não toca no inimigo
    player.board[slotIndex] = card
    magicAnimations.push({
      casterPlayer: currentPlayer,
      casterSlot: slotIndex,
      targetSlots: getTargetsForMagic(card, slotIndex)
    })
  }
  // Carta mágica de buff
  else if(card.type === "magic" && card.subtype === "buff"){
    player.board[slotIndex] = card
    card.turnsRemaining = card.duration
  }

  // Remove da mão
  player.hand.splice(selectedCardIndex, 1)
  selectedCardIndex = null
  render()
}	
function handleSlotClick(playerIndex, slotIndex){

  if(playerIndex !== currentPlayer) return

  const player = players[currentPlayer]
  const card = player.hand[selectedCardIndex]
  const slotCard = player.board[slotIndex]

  if(!card) return

  // Se for carta de combate, só pode colocar em slot vazio
  if(card.type === "combat" && slotCard !== null) return

  // Se for carta mágica
  if(card.type === "magic"){
    if(slotCard && slotCard.type === "magic") return // não sobrepor mágica
  }

  placeCard(slotIndex)
}

function resolveMagicEffects(playerIndex){

  const player = players[playerIndex]
  const enemy = players[1 - playerIndex]

  player.board.forEach((card, index) => {

    if(!card || card.type !== "magic") return

    const row = getRow(index)

    if(card.subtype === "buff"){

      card.turnsRemaining--

      if(card.turnsRemaining <= 0){
        player.board[index] = null
      }

      return
    }

    const targets = []

    for(let col = 0; col < BOARD_COLS; col++){

      const i = getIndex(row, col)

      const target = enemy.board[i]

      if(!target || target.type !== "combat") continue

      targets.push(i)
    }

    magicAnimations.push({
      casterPlayer: playerIndex,
      casterSlot: index,
      targetSlots: targets,
      damage: card.attack
    })

  })
}

function confirmCastleChoice(){

  const selected =
    document.querySelector('input[name="castleOption"]:checked');

  if(!selected){
    alert("Escolha um castelo!");
    return;
  }

  const castleKey = selected.value;
  const castleData = castles[castleKey];

  const castle = new Card(castleData);

  players[selectingPlayer].castle = castle;
  players[selectingPlayer].board[7] = castle;

  // limpa seleção
  document
    .querySelectorAll('input[name="castleOption"]')
    .forEach(r => r.checked = false);

  if(selectingPlayer === 0){
    selectingPlayer = 1;
    document.getElementById("castleTitle").innerText =
      "Jogador 2 - Escolha seu Castelo";
  }
	else{
	  document.getElementById("castleSelection").style.display = "none";

	  // 🔥 MOSTRA OS BOTÕES
	  document.getElementById("gameControls").style.display = "block";

	  startGame();
	}
}
function resolveCombatPhase(playerIndex){

  const player = players[playerIndex]

  const attackOrder = [0,1,2,3,4,5,6,7,8]

  let delay = 0

  attackOrder.forEach(i=>{

    const attacker = player.board[i]

    if(!attacker || attacker.type !== "combat") return

    setTimeout(()=>{

      const column = i % 3
      const targetRow = attacker.range - 1

      attackLogic(playerIndex, attacker, i, column, targetRow)

    }, delay)

    delay += 700

  })
}
function attackLogic(playerIndex, attacker, attackerIndex, column, targetRow){

	if(attacker.status.freeze > 0){
	  attacker.status.freeze--
	  return
	}
  const enemy = players[1 - playerIndex]

  const rowsToCheck = [
    targetRow,
    (targetRow+1)%3,
    (targetRow+2)%3
  ]

  let damageMultiplier = 1

  for(let i=0;i<rowsToCheck.length;i++){

    const row = rowsToCheck[i]
    const index = row*3 + column
    const target = enemy.board[index]

    // ⚠️ IGNORA castelo
    if(target && target.type === "combat"){

      if(i===1) damageMultiplier = 1.2
      if(i===2) damageMultiplier = 1.5

      resolveAutoAttack(playerIndex, attacker, attackerIndex, index, damageMultiplier)
      return
    }
  }

  // nenhuma carta de combate encontrada → castelo
  attackCastle(playerIndex, attacker, attackerIndex)
}
function resolveAutoAttack(playerIndex, attacker, attackerIndex, targetIndex, multiplier=1){

  const player = players[playerIndex]
  const enemy = players[1-playerIndex]

  if(attacker.mana < getManaCost(attacker)){
    return
  }

  attacker.mana = 0

  const target = enemy.board[targetIndex]

  let damage = Math.round(attacker.attack * multiplier)

  // ⚡ efeito secundário: vulnerabilidade (burn do meteoro)
  if(target.status.burn > 0){
    damage = Math.round(damage * 1.5) // +50% dano
    target.status.burn = 0 // aplica só uma vez
  }

  animateAttack(playerIndex, attackerIndex, 1-playerIndex, targetIndex)

  setTimeout(()=>{
    target.currentHp -= damage
    if(target.currentHp <= 0){
      enemy.board[targetIndex] = null
    }
    render()
  },400)
}
function attackCastle(playerIndex, attacker, attackerIndex){

  const enemy = players[1-playerIndex]
  const castle = enemy.castle

  if(attacker.mana < getManaCost(attacker)){
    return
  }

  attacker.mana = 0

  const damage = attacker.attack

  animateAttack(playerIndex, attackerIndex, 1-playerIndex, 7)

  setTimeout(()=>{

    castle.currentHp -= damage

    if(castle.currentHp <= 0){
      alert("🏆 Vitória!")
      location.reload()
      return
    }

    render()

  },400)
}
//animação atk
function animateAttack(attackerPlayer, attackerIndex, targetPlayer, targetIndex){

  const attackerSlot =
    document.getElementById(`slot-${attackerPlayer}-${attackerIndex}`)

  const targetSlot =
    document.getElementById(`slot-${targetPlayer}-${targetIndex}`)

  if(attackerSlot){
    attackerSlot.classList.add("attackFlash")
    setTimeout(()=>attackerSlot.classList.remove("attackFlash"),400)
  }

  if(targetSlot){
    targetSlot.classList.add("hitFlash")
    setTimeout(()=>targetSlot.classList.remove("hitFlash"),400)
  }
}
//animação atk magia
async function playMagicAnimations(){

  for(const anim of magicAnimations){

    for(const slot of anim.targetSlots){

	const targetElement =
	document.getElementById(`slot-${1-anim.casterPlayer}-${slot}`)
	
      if(targetElement){

        targetElement.classList.add("magic-hit")

        await new Promise(r => setTimeout(r,200))

        targetElement.classList.remove("magic-hit")
      }
    }
  }
}
function applyMagicDamage(){

  for(const anim of magicAnimations){

    const player = players[anim.casterPlayer]
    const enemy = players[1 - anim.casterPlayer]
    const magicCard = player.board[anim.casterSlot]
    if(!magicCard) continue

    anim.targetSlots.forEach(slot => {
      const target = enemy.board[slot]
      if(!target || target.type !== "combat") return

      // Aplica o efeito da magia
      if(magicEffects[magicCard.effect]){
        if(magicCard.effect === "flameMeteor") magicEffects.flameMeteor(target, anim.damage)
        else if(magicCard.effect === "blizzard") magicEffects.blizzard(target, anim.damage)
        else if(magicCard.effect === "thunderStorm") magicEffects.thunderStorm(target, anim.damage)
        else if(magicCard.effect === "tornado") magicEffects.tornado(target, anim.damage, enemy.board, slot)
      }

      // Aplica cor da magia na fileira
      applyRowColor(anim.casterPlayer, slot, magicCard.effect)
    })

    // Remove carta de magia do tabuleiro
    player.board[anim.casterSlot] = null
  }

  magicAnimations = []
}
function pushRowBack(enemyBoard, slot){
  const row = Math.floor(slot / BOARD_COLS)
  if(row === 2) return  // Torre não se move

  for(let i = row * 3; i < row * 3 + 3; i++){
    const card = enemyBoard[i]
    if(!card) continue

    const newSlot = i + 3
    if(!enemyBoard[newSlot]){
      enemyBoard[newSlot] = card
      enemyBoard[i] = null
    }
  }
}

function applyStatusEffects(playerIndex){

  const player = players[playerIndex]

  player.board.forEach(card => {

    if(!card || card.type !== "combat") return

    if(card.status.burn > 0){
	  // aplica somente se o efeito ainda é válido
	  damage = Math.round(damage * 1.5)
	  target.status.burn = null // efeito aplicado
    }

    // SHOCK
    if(card.status.shock > 0){
      card.currentHp -= card.status.shock
      card.status.shock = 0
    }

    // se morrer remove
    if(card.currentHp <= 0){
      const index = player.board.indexOf(card)
      player.board[index] = null
    }

  })
}
function cleanupDeadUnits(player){

  player.board.forEach((card,index)=>{

    if(card && card.currentHp <= 0){
      player.board[index] = null
    }
  })
}

function applyRowColor(casterPlayer, slot, effect){
  const row = Math.floor(slot / BOARD_COLS)
  let color = null
  switch(effect){
    case "flameMeteor": color = "red"; break
    case "blizzard": color = "blue"; break
    case "thunderStorm": color = "purple"; break
    case "tornado": color = "grey"; break
  }
  if(color){
    rowEffects.push({
      playerIndex: 1 - casterPlayer, // inimigo
      row,
      color,
      turnsRemaining: 1
    })
  }
}
function updateRowEffects(){
  rowEffects.forEach(e => e.turnsRemaining--)
  rowEffects = rowEffects.filter(e => e.turnsRemaining > 0)
}
function getCardStatusColor(card){
  if(!card || card.type !== "combat") return null

  if(card.status.burn > 0) return "red"
  if(card.status.freeze > 0) return "blue"
  if(card.status.shock > 0) return "purple"

  return null
}
function canPlaceCard(player, slotIndex, cardToPlace){
  const slotCard = player.board[slotIndex]

  if(!slotCard) return true // slot vazio

  if(cardToPlace.type === "combat"){
    // carta de combate nunca pode substituir outra
    return false
  }

  if(cardToPlace.type === "magic"){
    // carta mágica pode substituir carta de combate, mas não mágica
    if(slotCard.type === "magic") return false
    if(slotCard.type === "combat") return true
  }

  return false
}
function getTargetsForMagic(card, slotIndex){
  const enemy = players[1 - currentPlayer]
  const row = getRow(slotIndex)
  const targets = []

  for(let col = 0; col < BOARD_COLS; col++){
    const i = getIndex(row, col)
    if(enemy.board[i] && enemy.board[i].type === "combat"){
      targets.push(i)
    }
  }
  return targets
}