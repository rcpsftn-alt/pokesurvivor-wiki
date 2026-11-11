(() => {
'use strict';
/* ============ données et utilitaires ============ */
const W = JSON.parse(document.getElementById('data').textContent);
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nz = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fr1 = v => String(+(+v).toFixed(2)).replace('.', ',');
const fn = n => Number(n).toLocaleString('fr-FR');
const pad = d => '#' + String(d).padStart(4, '0');
const debounce = (f, ms = 130) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
const store = {
  get(k, d) { try { const v = localStorage.getItem('psw.' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('psw.' + k, JSON.stringify(v)); } catch (_) {} }
};

const TF = { normal: 'Normal', fire: 'Feu', water: 'Eau', electric: 'Électrik', grass: 'Plante', ice: 'Glace', fighting: 'Combat', poison: 'Poison', ground: 'Sol', flying: 'Vol', psychic: 'Psy', bug: 'Insecte', rock: 'Roche', ghost: 'Spectre', dragon: 'Dragon', dark: 'Ténèbres', steel: 'Acier', fairy: 'Fée' };
const TC = { normal: '#8d8c70', fire: '#e8602c', water: '#3f84e0', electric: '#d9a800', grass: '#4aa84f', ice: '#4cb6c4', fighting: '#c03a2f', poison: '#a14cb5', ground: '#b08a45', flying: '#7d8fe0', psychic: '#e5527f', bug: '#8aa31f', rock: '#9b8a3c', ghost: '#6a5a9e', dragon: '#5b3fd0', dark: '#5a4a40', steel: '#7d8a9c', fairy: '#d77fb8' };
const TY = Object.keys(TF);
const RG = ['', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unys', 'Kalos', 'Alola', 'Galar', 'Paldea'];
const ST = [['hp', 'PV'], ['pa', 'ATK'], ['sa', 'ATK SP'], ['df', 'DEF'], ['sd', 'DEF SP'], ['spd', 'VITESSE'], ['bst', 'TOTAL']];
const NL = { pa: 'ATK', sa: 'ATK SP', df: 'DEF', sd: 'DEF SP', spd: 'VITESSE' };
const ROUTES = [['pokedex', 'Pokédex', '📕'], ['talents', 'Talents et natures', '🧬'], ['attaques', 'Attaques', '⚔️'], ['types', 'Types', '🔥'], ['objets', 'Objets et boutique', '🎒'], ['ennemis', 'Ennemis', '👾'], ['succes', 'Succès et missions', '🏅'], ['arceus', 'Arceus', '⚖️'], ['nouveautes', 'Nouveautés', '🆕']];

const P = W.P.map(a => ({ dex: a[0], en: a[1], fr: a[2], name: a[2], types: a[3], hp: a[4], pa: a[5], sa: a[6], df: a[7], sd: a[8], spd: a[9], bst: a[10], rar: a[11], gen: a[12], leg: !!a[13], st: !!a[14] }));
const PB = {}, IDX = {};
P.forEach((p, i) => { PB[p.dex] = p; IDX[p.dex] = i; });
const MM = {};
ST.forEach(([k]) => { const v = P.map(p => p[k]); MM[k] = [Math.min(...v), Math.max(...v)]; });
const pct = (k, v) => Math.max(4, Math.round((v - MM[k][0]) / (MM[k][1] - MM[k][0]) * 100));
const fmt = (k, v) => (k === 'pa' || k === 'sa') ? (+v).toFixed(2).replace('.', ',') : String(v);

const MV = W.MV.map(a => ({ id: a[0], fr: a[1], en: a[2], type: a[3], kind: a[4], cat: a[5], cd: a[6], dmg: a[7], cnt: a[8], rad: a[9], desc: a[10], ups: a[11], max: a[12], tm: a[13] }));
const MVB = {}; MV.forEach(m => MVB[m.id] = m);
const AB = W.AB, DA = W.DA, NAT = W.NAT;

/* ============ état ============ */
const D0 = { q: '', gen: '', ty: '', fl: '', k: 'dex', d: 1 };
let LG = store.get('lang', 'fr') === 'en' ? 'en' : 'fr';
let THEME = store.get('theme', 'auto');
let VIEW = store.get('view', 'table') === 'cards' ? 'cards' : 'table';
let FV = new Set(store.get('fav', []));
let CMP = [];
let S = { ...D0 }, R = {}, S2 = { q: '', h: '', k: 'dex', d: 1 }, MS = { q: '', ty: '', kd: '', ct: '', k: 'name', d: 1 }, AS = { q: '', cat: '' }, NS = { k: '', q: '' };
let LV = [], NSEL = 0, cur = 'pokedex', shown = '', DL = null;
const dirty = {}; ROUTES.forEach(r => dirty[r[0]] = true);
const IS_ART = /claude|anthropic/.test(location.hostname);
const BASE = IS_ART ? 'https://claude.ai/artifact/Ax6TeHqPw86BGP41Kx9jYe' : location.origin + location.pathname;

const setHash = h => { try { history.replaceState(null, '', h); } catch (_) { location.hash = h; } };
const mvn = m => LG === 'fr' ? m.fr : m.en;
const abn = id => { const a = AB[id]; return a ? (LG === 'fr' ? a[0] : a[1]) : id; };
const spr = (dex, c = '') => { const i = IDX[dex]; return i == null ? '' : `<i class="sp ${c}" style="--x:${i % 32};--y:${i / 32 | 0}" aria-hidden="true"></i>`; };
const tyB = t => `<span class="t" style="background:${TC[t]}">${TF[t]}</span>`;
const tyH = p => p.types.map(tyB).join('');
const tcs = types => `--tc:${TC[types[0]]};--tc2:${TC[types[1]] || TC[types[0]] + 'aa'}`;
const TT = (hd, rows, cls = '') => `<div class="tw ${cls}"><table class="tt"><thead><tr>${hd.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const plink = p => `<a class="chip2" href="#/pokemon/${p.dex}">${esc(p.name)}</a>`;
const mlink = m => `<a class="chip2" href="#/attaque/${m.id}">${esc(mvn(m))}</a>`;
const sortTh = (cols, st, tbl) => cols.map(([k, l, c]) => `<th data-sort="${k}" data-tbl="${tbl}" class="${c || ''}${st.k === k ? ' on' : ''}" aria-sort="${st.k === k ? (st.d > 0 ? 'ascending' : 'descending') : 'none'}">${l}${st.k === k ? (st.d > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('');

function toast(t) { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => e.hidden = true, 2200); }

/* rendu progressif des longues listes */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target._more) e.target._more(); }), { rootMargin: '500px' }) : null;
function paint(el, items, rowFn, chunk = 80) {
  const isT = el.tagName === 'TBODY'; let n = 0; el.innerHTML = '';
  const add = () => {
    const old = el.querySelector(':scope > .more'); if (old) { if (io) io.unobserve(old); old.remove(); }
    el.insertAdjacentHTML('beforeend', items.slice(n, n + chunk).map(rowFn).join('')); n += chunk;
    if (n < items.length) {
      const lbl = `Afficher la suite (${items.length - n})`;
      el.insertAdjacentHTML('beforeend', isT ? `<tr class="more"><td colspan="99"><button type="button">${lbl}</button></td></tr>` : `<button type="button" class="more morec">${lbl}</button>`);
      const s = el.lastElementChild; s._more = add; s.addEventListener('click', add); if (io) io.observe(s);
    }
  };
  add();
}

/* ============ Pokédex ============ */
const inR = p => Object.keys(R).every(k => { const [a, b] = R[k]; return (a == null || p[k] >= a) && (b == null || p[k] <= b); });
function dexList() {
  const q = nz(S.q.trim()), num = q.replace('#', '');
  const L = P.filter(p => (!q || nz(p.fr + ' ' + p.en).includes(q) || String(p.dex) === num) && (!S.gen || p.gen == S.gen) && (!S.ty || p.types.includes(S.ty))
    && (!S.fl || (S.fl === 'st' ? p.st : S.fl === 'leg' ? p.leg : S.fl === 'fav' ? FV.has(p.dex) : !p.leg)) && inR(p));
  const key = p => S.k === 'fav' ? +FV.has(p.dex) : S.k === 'types' ? p.types.map(t => TF[t]).join() : p[S.k];
  return L.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'string' ? x.localeCompare(y, 'fr') : x - y) * S.d || a.dex - b.dex; });
}
const favB = d => `<button type="button" class="fv" data-fav="${d}" aria-pressed="${FV.has(d)}" aria-label="Favori">★</button>`;
function renderDex() {
  $('tot').textContent = P.length;
  $('rec').innerHTML = ST.map(([k, l]) => { const p = P.reduce((a, b) => b[k] > a[k] ? b : a); return `<button type="button" data-p="${p.dex}">${spr(p.dex)}<small>Record ${l}</small><b>${esc(p.name)}</b><i>${fmt(k, p[k])}</i></button>`; }).join('');
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === VIEW));
  const L = LV = dexList();
  $('cnt').textContent = L.length ? `${L.length} Pokémon affiché${L.length > 1 ? 's' : ''}` : 'Aucun Pokémon ne correspond. Élargis les filtres ou réinitialise.';
  if (VIEW === 'cards') {
    $('plist').innerHTML = '<div class="cards" id="pcards"></div>';
    paint($('pcards'), L, p => `<button type="button" class="pc" data-p="${p.dex}" style="${tcs(p.types)}"><span class="art">${spr(p.dex)}</span><span class="tt2">${p.bst}</span><span class="in"><span class="num">${pad(p.dex)}</span><b>${esc(p.name)}</b>${tyH(p)}</span></button>`, 60);
  } else {
    const cols = [['fav', '★'], ['dex', 'N°'], ['name', 'Nom', 'nm'], ['types', 'Types'], ...ST];
    $('plist').innerHTML = `<div class="tw"><table><thead><tr>${sortTh(cols, S, 'dex')}</tr></thead><tbody id="tb"></tbody></table></div>`;
    paint($('tb'), L, p => `<tr class="row" data-p="${p.dex}"><td>${favB(p.dex)}</td><td class="n">${pad(p.dex)}</td><td class="nm">${spr(p.dex)}${esc(p.name)}</td><td>${tyH(p)}</td>${ST.map(([k]) => k === 'bst' ? `<td class="tot">${p.bst}</td>` : `<td class="num cell">${fmt(k, p[k])}<i style="width:${pct(k, p[k])}%"></i></td>`).join('')}</tr>`);
  }
}
function syncDexUI() {
  $('q').value = S.q; $('gen').value = S.gen; $('ty').value = S.ty; $('fl').value = S.fl;
  document.querySelectorAll('#rgg input').forEach(i => { const r = R[i.dataset.r]; i.value = r && r[+i.dataset.m] != null ? r[+i.dataset.m] : ''; });
}
function exportCsv() {
  if (!LV.length) return;
  const c = v => String(v).replace('.', ',');
  const rows = [['N° Pokédex', 'Nom', 'Nom anglais', 'Types', 'PV', 'ATK', 'ATK SP', 'DEF', 'DEF SP', 'VITESSE', 'TOTAL']].concat(LV.map(p => [p.dex, p.name, p.en, p.types.map(t => TF[t]).join('/'), p.hp, c(p.pa), c(p.sa), p.df, p.sd, p.spd, p.bst]));
  const data = '﻿' + rows.map(r => r.join(';')).join('\r\n');
  if (DL) { DL.save({ filename: 'pokesurvivor-stats.csv', data }).catch(e => { if (!e || e.code !== 'declined') toast('Export impossible'); }); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' })); a.download = 'pokesurvivor-stats.csv';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(`${LV.length} lignes exportées`);
}

/* ============ fiche Pokémon ============ */
const dlg = $('dlg'), cd = $('cd');
function openDlg(html, wide) { cd.className = 'sheet' + (wide ? ' wide' : ''); cd.innerHTML = html; if (!dlg.open) dlg.showModal(); cd.scrollTop = 0; }
const closeB = '<button type="button" class="xb" data-close aria-label="Fermer">✕</button>';
const RK = ['hp', 'pa', 'df', 'sa', 'sd', 'spd'], SL = Object.fromEntries(ST);
const CC = ['#e23d3d', '#3f84e0', '#3aa655', '#e8a000', '#9b51c9', '#16a6a6', '#e0529c', '#8a7355', '#93a0b4', '#ff7a3d'];
function radar(L, single) {
  const cx = 150, cy = 122, RR = 80, pt = (i, f) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [(cx + Math.cos(a) * RR * f).toFixed(1), (cy + Math.sin(a) * RR * f).toFixed(1)]; };
  let s = `<svg class="radar" viewBox="0 0 300 244" width="100%" style="max-width:340px;display:block;margin:0 auto" role="img" aria-label="Radar des six stats">`;
  [.25, .5, .75, 1].forEach(f => s += `<polygon points="${RK.map((k, i) => pt(i, f).join(',')).join(' ')}" fill="none" stroke="var(--bd)"/>`);
  RK.forEach((k, i) => { const [x, y] = pt(i, 1); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--bd)"/>`; });
  L.forEach((p, j) => { const col = single ? TC[p.types[0]] : CC[j]; s += `<polygon points="${RK.map((k, i) => pt(i, .08 + .92 * (p[k] - MM[k][0]) / (MM[k][1] - MM[k][0])).join(',')).join(' ')}" fill="${col}" fill-opacity="${single ? .3 : L.length > 4 ? .06 : .15}" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`; });
  RK.forEach((k, i) => { const [x, y] = pt(i, single ? 1.24 : 1.16), an = Math.abs(x - cx) < 5 ? 'middle' : x > cx ? 'start' : 'end';
    s += single ? `<text class="l" x="${x}" y="${+y - 3}" text-anchor="${an}">${SL[k]}</text><text class="v" x="${x}" y="${+y + 12}" text-anchor="${an}">${fmt(k, L[0][k])}</text>` : `<text class="l" x="${x}" y="${+y + 4}" text-anchor="${an}">${SL[k]}</text>`; });
  return s + '</svg>';
}
const GM = v => v >= 2 ? 1.6 : v === 0 ? .3 : v < 1 ? .6 : 1;
const cm = (a, d) => { const r = W.CHART[a] || {}; return GM(r[d] == null ? 1 : r[d]); };
const tmult = (a, ts) => Math.min(2.4, Math.max(.3, ts.reduce((k, d) => k * cm(a, d), 1)));
function weakH(p) {
  const w = [], r = [], i = [];
  TY.forEach(t => { const k = tmult(t, p.types); if (k > 1) w.push(tyB(t) + '×' + fr1(k)); else if (k <= .3) i.push(tyB(t)); else if (k < 1) r.push(tyB(t) + '×' + fr1(k)); });
  const L = (l, a) => a.length ? `<div><span class="l">${l}</span>${a.join(' &nbsp;')}</div>` : '';
  return `<h3 class="h3">Faiblesses et résistances</h3><div class="wk">${L('Faible à', w)}${L('Résiste à', r)}${L('Très résistant (×0,3) à', i)}</div>`;
}
const nf = (k, v) => (k === 'pa' || k === 'sa') ? v.toFixed(2).replace('.', ',') : fr1(Math.round(v * 10) / 10);
function natH(p) {
  const n = NAT[NSEL];
  const opts = NAT.map((x, i) => `<option value="${i}"${i === NSEL ? ' selected' : ''}>${esc(LG === 'fr' ? x[0] : x[1])}${x[2] ? ` (+${NL[x[2]]} −${NL[x[3]]})` : ' (neutre)'}</option>`).join('');
  return `<h3 class="h3"><label for="ns">Avec une nature</label></h3><select id="ns" data-p="${p.dex}">${opts}</select><div class="nr"><span></span><span>Base</span><span>Avec nature</span>${
    ['pa', 'sa', 'df', 'sd', 'spd'].map(k => { const m = n[2] === k ? 1.1 : n[3] === k ? .9 : 1; return `<span>${NL[k]}</span><b>${nf(k, p[k])}</b><b${m > 1 ? ' class="up"' : m < 1 ? ' class="dn"' : ''}>${nf(k, p[k] * m)}</b>`; }).join('')}</div>`;
}
const GEN = '+8 % de dégâts avec les capacités de type {x}.';
const gtxt = p => GEN.replace('{x}', TF[p.types[0]]);
function abd(id, p) {
  const a = AB[id]; if (!a) return ''; let t = a[2];
  if (!t) return p ? gtxt(p) : 'Passif générique : +8 % de dégâts avec les capacités de son type principal.';
  if (a[3]) t += p ? ' ' + gtxt(p) : ' Ajoute aussi +8 % de dégâts avec les capacités de son type principal.';
  return t;
}
function abilH(p) {
  const s = DA[p.dex] || [0, 0, 0];
  const row = (id, l) => id ? `<div class="ar"><span class="lbl">${l}</span><a class="lk" href="#/talent/${id}">${esc(abn(id))}</a><small>${esc(abd(id, p))}</small></div>` : '';
  return `<h3 class="h3">Talents</h3>${row(s[0], 'Talent 1')}${s[1] && s[1] !== s[0] ? row(s[1], 'Talent 2') : ''}${row(s[2], 'Caché')}`;
}
function mvH(p) {
  const base = W.PDEX_START[p.dex] || W.STARTT[p.types[0]] || 'tackle', own = m => m.type === 'normal' || p.types.includes(m.type);
  const nat = MV.filter(own), cts = MV.filter(m => !own(m) && (W.TM[m.id] || []).includes(p.dex));
  const ch = L => `<div class="chips" style="margin-top:8px">${L.map(mlink).join('')}</div>`;
  return `<h3 class="h3">Attaques</h3><div class="ar"><span class="lbl">Départ</span><a class="lk" href="#/attaque/${base}">${esc(mvn(MVB[base]))}</a></div><details><summary>Attaques de ses types (${nat.length})</summary>${ch(nat)}</details>${cts.length ? `<details><summary>CT apprenables (${cts.length})</summary>${ch(cts)}</details>` : ''}`;
}
function openP(dex) {
  const p = PB[dex]; if (!p) return closeToSection();
  const i = IDX[dex], pv = P[i - 1], nx = P[i + 1], inC = CMP.includes(p.dex);
  openDlg(`<div class="hero" style="${tcs(p.types)}"><div><h2>${esc(p.name)}</h2><p class="m">${pad(p.dex)}, ${RG[p.gen]} (génération ${p.gen})${p.fr !== p.en ? ' — ' + esc(LG === 'fr' ? p.en : p.fr) : ''}</p><div>${tyH(p)}</div>
    <div style="margin-top:8px"><span class="badge">Rareté ${'★'.repeat(p.rar)}</span>${p.st ? '<span class="badge">Starter</span>' : ''}${p.leg ? '<span class="badge">Légendaire</span>' : ''}</div></div>${spr(p.dex, 'xl')}${closeB}</div>
  <div class="sb">
    <div class="blk">${radar([p], true)}<p class="cnt" style="text-align:center;margin:4px 0 0">Total ${p.bst}. Échelle : de la valeur la plus basse à la plus haute du jeu.</p></div>
    <div class="acts"><button type="button" class="btn" data-fav="${p.dex}" data-lbl="1">${FV.has(p.dex) ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}</button><button type="button" class="btn${inC ? '' : ' pri'}" data-cmp="${p.dex}">${inC ? 'Retirer du comparateur' : 'Ajouter au comparateur'}</button></div>
    <div class="blk">${weakH(p)}</div><div class="blk">${natH(p)}</div><div class="blk">${abilH(p)}</div><div class="blk">${mvH(p)}</div>
    <div class="pn"><button type="button" class="btn" data-step="${pv ? pv.dex : ''}"${pv ? '' : ' disabled'}>←${pv ? spr(pv.dex, 's') + `<span>${esc(pv.name)}</span>` : ''}</button><button type="button" class="btn" data-step="${nx ? nx.dex : ''}"${nx ? '' : ' disabled'}>${nx ? `<span>${esc(nx.name)}</span>` + spr(nx.dex, 's') : ''}→</button></div>
  </div>`);
}

/* ============ comparateur ============ */
function tray() {
  const t = $('tray'); t.hidden = !CMP.length;
  t.innerHTML = `<b>Comparateur</b>${CMP.map(d => `<span class="chip">${esc(PB[d].name)}<button type="button" data-uncmp="${d}" aria-label="Retirer ${esc(PB[d].name)}">✕</button></span>`).join('')}<button type="button" class="btn pri" data-go="comparer"${CMP.length < 2 ? ' disabled' : ''}>Comparer</button><button type="button" class="btn" data-clrcmp>Vider</button>`;
}
function openC() {
  const L = CMP.map(d => PB[d]); if (L.length < 2) return closeToSection();
  const g = `grid-template-columns:76px repeat(${L.length},minmax(62px,1fr))`;
  let o = `<div class="cg" style="${g}"><span></span>${L.map((p, j) => `<div class="ch">${spr(p.dex)}<b style="color:${CC[j]}">${esc(p.name)}</b></div>`).join('')}</div>`;
  o += ST.map(([k, l]) => { const mx = Math.max(...L.map(p => p[k])); return `<div class="cg" style="${g}"><span class="lb2">${l}</span>${L.map(p => `<div class="cc${p[k] === mx && L.some(q => q[k] !== mx) ? ' best' : ''}"><b>${fmt(k, p[k])}</b><div class="tr"><i style="width:${pct(k, p[k])}%"></i></div></div>`).join('')}</div>`; }).join('');
  openDlg(`<div class="hero plain"><div><h2>Comparaison</h2><p class="m">${L.length} Pokémon. La meilleure valeur de chaque ligne est en vert.</p></div>${closeB}</div><div class="sb">
    <div class="blk"><div class="lg">${L.map((p, j) => `<span style="color:${CC[j]}">● ${esc(p.name)}</span>`).join('')}</div>${radar(L, false)}</div>
    <div class="blk"><div style="overflow-x:auto"><div style="min-width:${76 + 70 * L.length}px">${o}</div></div></div></div>`, L.length > 3);
}

/* ============ talents et natures ============ */
function renderTalents() {
  $('nb').innerHTML = NAT.map(n => `<tr><td>${esc(LG === 'fr' ? n[0] : n[1])}</td><td>${n[2] ? NL[n[2]] : 'Neutre'}</td><td>${n[3] ? NL[n[3]] : 'Neutre'}</td></tr>`).join('');
  const q = nz(S2.q.trim()), ns = p => (DA[p.dex] || [0, 0, 0]).map(i => i ? abn(i) : '');
  const L = P.filter(p => { const s = DA[p.dex] || [0, 0, 0]; if (S2.h === 'h' && !s[2]) return false; if (S2.h === 'n' && s[2]) return false;
    return !q || nz([p.fr, p.en, p.dex].concat(s.filter(Boolean).map(i => AB[i][0] + ' ' + AB[i][1])).join(' ')).includes(q); });
  const key = p => S2.k === 'dex' ? p.dex : S2.k === 'name' ? p.name : ns(p)[+S2.k[1]] || '￿';
  L.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'string' ? x.localeCompare(y, 'fr') : x - y) * S2.d || a.dex - b.dex; });
  $('hd2').innerHTML = sortTh([['dex', 'N°'], ['name', 'Nom', 'nm'], ['a0', 'Talent 1'], ['a1', 'Talent 2'], ['a2', 'Talent caché']], S2, 'tal');
  const a = i => i ? `<a class="lk" href="#/talent/${i}">${esc(abn(i))}</a>` : '<span style="color:var(--mu)">—</span>';
  paint($('tb2'), L, p => { const s = DA[p.dex] || [0, 0, 0]; return `<tr><td class="n">${pad(p.dex)}</td><td class="nm"><a href="#/pokemon/${p.dex}" style="color:inherit;text-decoration:none">${spr(p.dex, 's')}${esc(p.name)}</a></td><td>${a(s[0])}</td><td>${s[1] && s[1] !== s[0] ? a(s[1]) : a(0)}</td><td>${a(s[2])}</td></tr>`; });
  $('cnt2').textContent = `${L.length} Pokémon affiché${L.length > 1 ? 's' : ''}`;
}
function openA(id) {
  const a = AB[id]; if (!a) return closeToSection(); const n = [], hd = [];
  P.forEach(p => { const s = DA[p.dex] || [0, 0, 0]; if (s[0] === id || s[1] === id) n.push(p); else if (s[2] === id) hd.push(p); });
  const ch = L => `<div class="chips">${L.map(plink).join('')}</div>`;
  openDlg(`<div class="hero plain"><div><h2>${esc(abn(id))}</h2><p class="m">Talent — ${esc(LG === 'fr' ? a[1] : a[0])}</p></div>${closeB}</div><div class="sb"><div class="blk"><p style="margin:0">${esc(abd(id))}</p></div>
    ${n.length ? `<div class="blk"><h3 class="h3">Talent normal (${n.length})</h3>${ch(n)}</div>` : ''}${hd.length ? `<div class="blk"><h3 class="h3">Talent caché (${hd.length})</h3>${ch(hd)}</div>` : ''}</div>`);
}

/* ============ attaques ============ */
const KF = { projectile: 'Projectile', melee: 'Corps à corps', beam: 'Rayon', orbit: 'Orbes', nova: 'Explosion radiale', aura: 'Aura', buff: 'Boost', boomerang: 'Boomerang', chain: 'Chaîne', mine: 'Mines', meteor: 'Météores', turret: 'Tourelle', dash: 'Charge', trail: 'Traînée', cone: 'Cône', homing: 'Tête chercheuse', bounce: 'Rebond', charge: 'Rayon chargé', spin: 'Tourbillon', quake: 'Onde de sol', vortex: 'Vortex', shove: 'Onde de choc', stun: 'Zone étourdissante' };
const KD = { projectile: 'Tire des projectiles sur l’ennemi le plus proche.', melee: 'Frappe en arc autour du Pokémon.', beam: 'Rayon droit qui traverse tout.', orbit: 'Des orbes tournent autour de toi tant que l’attaque est active.', nova: 'Rafale dans toutes les directions.', aura: 'Cercle de dégâts continus autour de toi.', buff: 'Renforce ton Pokémon (cumulable, temporaire).', boomerang: 'Part vers l’ennemi et revient, en frappant à l’aller et au retour.', chain: 'Frappe un ennemi puis saute aux suivants les plus proches.', mine: 'Mines au sol qui explosent quand on marche dessus.', meteor: 'Des météores tombent sur les ennemis proches (l’ombre prévient).', turret: 'Pose une tourelle qui tire seule pendant quelques secondes.', dash: 'Tu traverses vers l’ennemi en frappant tout sur le chemin, sans subir de dégâts.', trail: 'Tu laisses des flaques qui blessent ceux qui les piétinent.', cone: 'Nombreux tirs courts en éventail.', homing: 'Projectiles qui poursuivent l’ennemi.', bounce: 'Un projectile rebondit d’ennemi en ennemi.', charge: 'Se charge quelques secondes puis lance un énorme rayon.', spin: 'Tu tournes en frappant tout autour, plusieurs fois de suite.', quake: 'Une onde avance au sol en ligne, avec plusieurs explosions.', vortex: 'Un tourbillon attire les ennemis au centre et les blesse.', shove: 'Onde autour de toi qui blesse et repousse les ennemis.', stun: 'Zone annoncée qui blesse et étourdit (immobilise) les ennemis.' };
const CF = { physical: 'Physique', special: 'Spécial', '': '—' };
function renderMoves() {
  const q = nz(MS.q.trim());
  const L = MV.filter(m => (!q || nz(m.fr + ' ' + m.en).includes(q)) && (!MS.ty || m.type === MS.ty) && (!MS.kd || m.kind === MS.kd) && (!MS.ct || W.TM[m.id]));
  const key = m => MS.k === 'name' ? mvn(m) : MS.k === 'kind' ? KF[m.kind] : MS.k === 'type' ? TF[m.type] : MS.k === 'cat' ? CF[m.cat] : m[MS.k];
  L.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'string' ? x.localeCompare(y, 'fr') : x - y) * MS.d || mvn(a).localeCompare(mvn(b), 'fr'); });
  $('mhd').innerHTML = sortTh([['type', 'Type'], ['name', 'Nom', 'nm'], ['cat', 'Catégorie'], ['kind', 'Genre'], ['dmg', 'Dégâts'], ['cd', 'Recharge'], ['tm', 'Prix de la CT']], MS, 'mv');
  const mxd = Math.max(...MV.map(m => m.dmg));
  $('mtb').innerHTML = L.map(m => `<tr class="row" data-href="#/attaque/${m.id}"><td>${tyB(m.type)}</td><td class="nm"><a href="#/attaque/${m.id}" style="color:inherit;text-decoration:none">${esc(mvn(m))}</a></td><td>${CF[m.cat]}</td><td>${KF[m.kind]}</td><td class="num cell">${m.dmg}<i style="width:${Math.round(m.dmg / mxd * 100)}%"></i></td><td class="num">${fr1(m.cd)} s</td><td class="num">${W.TM[m.id] ? fn(m.tm) : '—'}</td></tr>`).join('');
  $('mcnt').textContent = L.length ? `${L.length} attaque${L.length > 1 ? 's' : ''} affichée${L.length > 1 ? 's' : ''}` : 'Aucune attaque ne correspond.';
}
function openM(id) {
  const m = MVB[id]; if (!m) return closeToSection();
  const cts = (W.TM[id] || []).map(d => PB[d]).filter(Boolean), ev = W.EVO[id];
  const kv = [['Dégâts', m.dmg], ['Recharge', fr1(m.cd) + ' s']]; if (m.cnt) kv.push(['Nombre', m.cnt]); if (m.rad) kv.push(['Rayon', m.rad]);
  kv.push(['Niveau max', m.max], ['Prix de la CT', W.TM[id] ? fn(m.tm) + ' Poképièces' : 'pas de CT']);
  openDlg(`<div class="hero" style="${tcs([m.type])};min-height:0"><div><h2>${esc(mvn(m))}</h2><p class="m">Attaque — ${esc(LG === 'fr' ? m.en : m.fr)}</p><div>${tyB(m.type)}<span class="badge">${KF[m.kind]}</span><span class="badge">${CF[m.cat]}</span></div></div>${closeB}</div>
  <div class="sb"><div class="blk"><p style="margin:0 0 4px">${esc(m.desc)}</p><p class="cnt" style="margin:0 0 10px">${esc(KD[m.kind] || '')}</p><dl class="kv">${kv.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl></div>
    <div class="blk"><h3 class="h3">Niveaux</h3><ol style="margin:4px 0;padding-left:0;list-style:none;font-size:14px">${m.ups.map((u, i) => `<li>Niveau ${i + 2} : ${esc(u)}</li>`).join('')}</ol>
    ${ev ? `<h3 class="h3">Évolution</h3><p style="font-size:14px;margin:4px 0">Au niveau max, devient <b>${esc(mvn(m))} +</b> (bordure dorée) si tu as pris au moins une fois l’amélioration « ${esc(ev[0])} » pendant la partie.</p><p class="cnt" style="margin:0">Effet : ${esc(ev[1])}</p>` : ''}</div>
    <div class="blk"><h3 class="h3">Qui peut l’utiliser</h3><p style="font-size:14px;margin:4px 0">${m.type === 'normal' ? 'Tous les Pokémon.' : 'Les Pokémon de type ' + TF[m.type] + '.'}</p>
    ${cts.length ? `<h3 class="h3">Apprise par CT (${cts.length})</h3><div class="chips" style="max-height:220px;overflow:auto">${cts.map(plink).join('')}</div>` : ''}</div></div>`);
}

/* ============ types ============ */
function renderTypes() {
  const sh = t => `<span class="t" style="background:${TC[t]};margin:0" title="${TF[t]}">${TF[t].slice(0, 3)}</span>`;
  $('tmx').innerHTML = `<table class="mx"><thead><tr><th></th>${TY.map(t => `<th>${sh(t)}</th>`).join('')}</tr></thead><tbody>${TY.map(a => `<tr><th>${tyB(a)}</th>${TY.map(d => { const v = cm(a, d); return `<td class="${v > 1 ? 'm2' : v === .3 ? 'm0' : v < 1 ? 'm05' : ''}">${v === 1 ? '' : fr1(v)}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  const team = P.filter(p => FV.has(p.dex));
  if (!team.length) { $('tcv').innerHTML = '<p class="note">Ajoute des Pokémon à tes favoris (étoile ★ du Pokédex) pour voir ici les faiblesses communes de ton équipe.</p>'; return; }
  const nm = a => a.length ? a.map(p => esc(p.name)).join(', ') : '—';
  $('tcv').innerHTML = `<div class="chips" style="margin-bottom:10px">${team.map(p => `<a class="chip2" href="#/pokemon/${p.dex}">${spr(p.dex, 's')}${esc(p.name)}</a>`).join('')}</div><div class="tw"><table class="tt"><thead><tr><th>Type attaquant</th><th>Faibles</th><th>Résistants</th></tr></thead><tbody>${
    TY.map(t => { const w = team.filter(p => tmult(t, p.types) > 1), r = team.filter(p => tmult(t, p.types) < 1); return `<tr${w.length && w.length * 2 >= team.length ? ' class="warn"' : ''}><td>${tyB(t)}</td><td><b>${w.length}</b> ${nm(w)}</td><td><b>${r.length}</b> ${nm(r)}</td></tr>`; }).join('')}</tbody></table></div><p class="cnt" style="margin-top:8px">Les lignes teintées sont les types qui menacent au moins la moitié de l’équipe.</p>`;
}

/* ============ objets et boutique ============ */
function rng(seed) { let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function today() { const p = {}; for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())) p[x.type] = x.value; return p.year + p.month + p.day; }
function dailyTms() { const a = Object.keys(W.TM).sort(), r = rng('kecleon:' + today()); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 8); }
function renderItems() {
  const up = W.UPG.map(u => { let t = 0; for (let l = 0; l < u[2]; l++) t += Math.round(u[3] * Math.pow(u[4], l) / 10) * 10; return [esc(u[0]), esc(u[1]), u[2], fn(Math.round(u[3] / 10) * 10), fn(t)]; });
  const td = today(), ds = td.slice(6) + '/' + td.slice(4, 6) + '/' + td.slice(0, 4);
  $('tit').innerHTML = '<h2 class="sec" style="margin-top:0">CT du jour</h2><p class="cnt">8 CT par jour, identiques pour tous les joueurs (date en Espagne : ' + ds + '). La dernière peut être remplacée par une CT que ton compagnon sait apprendre.</p><div class="chips">' + dailyTms().map(id => `<a class="chip2" href="#/attaque/${id}">${tyB(MVB[id].type)}${esc(mvn(MVB[id]))} <b>${fn(MVB[id].tm || 400)}</b></a>`).join('') + '</div>'
    + '<h2 class="sec">Boutique Kecleon</h2>' + TT(['Article', 'Prix (Poképièces)', 'Effet'], W.SHOP.map(s => [esc(s[1]), fn(s[2]), esc(s[3])]))
    + '<h2 class="sec">Objets à tenir</h2>' + TT(['Objet', 'Effet'], W.ITEMS.map(i => [esc(i[0]), esc(i[1])]))
    + '<h2 class="sec">Orbes de Donjon Mystère</h2><p class="cnt">Objets à usage unique trouvés pendant la partie (coffres, boss, parfois en battant un Pokémon) et perdus à la fin. 4 emplacements, 3 de chaque au maximum. Les boss et légendaires sont moins affectés.</p>' + TT(['Orbe', 'Effet', 'Cible'], W.ORBS.map(o => [esc(o[0]), esc(o[1]), o[2] === 'foe' ? 'Ennemis' : 'Toi et tes coéquipiers proches']))
    + '<h2 class="sec">Charmes Chroma</h2><p class="note">Un charme par région (Kanto, Johto, Hoenn, Sinnoh, Unys, Kalos, Alola, Galar, Paldea). Complète le Pokédex d’une région, légendaires compris, pour l’obtenir : les chromatiques deviennent deux fois plus probables dans sa bannière de gacha (de 1 % à 2 %). Tu les trouves dans ton Sac.</p>'
    + '<h2 class="sec">Améliorations permanentes</h2>' + TT(['Amélioration', 'Effet par niveau', 'Niveau max', 'Coût du niveau 1', 'Coût total (Poképièces)'], up);
}

/* ============ ennemis ============ */
const BH = { chase: ['Poursuite', 'Fonce droit sur toi.'], charger: ['Charge', 'S’arrête, vise puis te charge.'], ranged: ['Distance', 'Reste à distance et tire.'], tank: ['Tank', 'Lent, avec beaucoup de PV.'], healer: ['Soigneur', 'Soigne les ennemis autour de lui.'], shielder: ['Bouclier', 'Pose des boucliers sur ses alliés.'], summoner: ['Invocateur', 'Appelle sa troupe (et certains Insecte appellent leurs semblables).'], bomber: ['Kamikaze', 'S’approche et explose.'], beamer: ['Rayon', 'Rayon annoncé au sol avant de tirer.'], zoner: ['Zones', 'Zones de dégâts sous tes pieds qui explosent peu après.'], fan: ['Éventail', 'Tire en éventail.'], jumper: ['Sauteur', 'Saute et retombe sur toi (la chute est annoncée au sol).'], runner: ['Coureur', 'Très rapide et fragile, il va là où tu seras. Un par tranche : le plus rapide de la troupe.'] };
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function renderEnemies() {
  const dn = a => a.map(d => PB[d] ? plink(PB[d]) : '').join(''), fx = { healer: W.HEAL, shielder: W.SHIELD, bomber: W.BOMB, summoner: W.SUMMON };
  $('ten').innerHTML = '<p class="note">Les ennemis sont répartis en 6 tranches selon le total de stats de base du Pokémon. Au début de chaque partie, un groupe est tiré au hasard dans chaque tranche. Les valeurs sont les gabarits de tranche, ajustés ensuite selon chaque Pokémon.</p>'
    + '<h2 class="sec">Les tranches</h2>' + TT(['Tranche', 'Dès', 'Total des Pokémon', 'PV', 'Vitesse', 'Dégâts', 'XP'], W.TIERS.map((t, i) => ['Tranche ' + (i + 1), mmss(t.from), t.bst[0] + ' à ' + t.bst[1], t.hp, t.spd, t.dmg, t.xp]))
    + '<h2 class="sec">Les boss</h2><p class="cnt">Des Pokémon forts non légendaires, tirés au hasard dans une plage de total. Leurs PV et dégâts sont multipliés par (1 + temps / 600 s) à l’apparition. Les légendaires ne sortent que dans les failles.</p>'
    + TT(['Apparition', 'PV de base', 'PV à l’apparition', 'Dégâts de base', 'XP', 'Total des Pokémon'], W.BOSS_SLOTS.map(b => [mmss(b.at), fn(b.hp), fn(Math.round(b.hp * (1 + b.at / 600))), b.dmg, b.xp, b.bst[0] + ' à ' + b.bst[1]]))
    + '<h2 class="sec">Les comportements</h2>' + TT(['Comportement', 'Description', 'Pokémon fixes'], Object.keys(BH).map(k => [BH[k][0], BH[k][1], fx[k] ? `<div class="chips">${dn(fx[k])}</div>` : '—']));
  scaleSim();
}
function scaleSim() {
  const m = +$('em').value, t = m * 60, sc = { hp: 1 + t / 95, dmg: 1 + t / 420, spd: 1 + Math.min(.35, t / 1400) };
  $('emv').textContent = m + ' min'; let c = 0; W.TIERS.forEach((x, i) => { if (t >= x.from) c = i; });
  $('esc').innerHTML = '<tr><th>Tranche</th><th>PV</th><th>Vitesse</th><th>Dégâts</th><th>XP</th></tr>' + W.TIERS.slice(0, c + 1).map((x, i) => `<tr><td>Tranche ${i + 1}${i === c ? ' (nouvelle)' : ''}</td><td>${fn(Math.round(x.hp * sc.hp))}</td><td>${Math.round(x.spd * sc.spd)}</td><td>${fr1(x.dmg * sc.dmg)}</td><td>${x.xp}</td></tr>`).join('')
    + `<tr><td colspan="5" style="color:var(--mu);font-weight:400">Multiplicateurs à ${m} min : PV ×${fr1(sc.hp)}, dégâts ×${fr1(sc.dmg)}, vitesse ×${fr1(sc.spd)} (plafonnée à ×1,35).</td></tr>`;
}

/* ============ succès et missions ============ */
const rw = r => [r.coins ? fn(r.coins) + ' Poképièces' : '', r.t1 ? r.t1 + ' ticket' + (r.t1 > 1 ? 's' : '') : '', r.t10 ? r.t10 + ' ticket' + (r.t10 > 1 ? 's' : '') + ' ×10' : ''].filter(Boolean).join(' + ');
const MED = ['', '🥉', '🥈', '🥇'];
function renderAch() {
  const q = nz(AS.q.trim());
  const A = W.ACH.filter(a => (!AS.cat || a[1] === AS.cat) && (!q || nz(a[3] + ' ' + a[4]).includes(q)));
  let o = A.length ? TT(['', 'Succès', 'Description', 'Récompense', 'Titre'], A.map(a => [MED[a[2]], esc(a[3]), esc(a[4]), rw(a[6]), esc(a[7]) || '—'])) : '';
  const lg = W.LEG.filter(l => (!AS.cat || AS.cat === 'legendarios') && (!q || nz((PB[l[0]] || { fr: '', en: '' }).fr + ' ' + (PB[l[0]] || { en: '' }).en + ' legendaire').includes(q)));
  if (lg.length) { const g = {}; lg.forEach(l => { const k = rw(JSON.parse(l[2])); (g[k] = g[k] || []).push(l); });
    o += '<h2 class="sec">Un succès par légendaire</h2><p class="cnt">Vaincre le légendaire dans une faille. La récompense dépend du légendaire.</p>' + Object.keys(g).map(k => `<h3 class="h3">${esc(k)} (${g[k].length})</h3><div class="chips">${g[k].map(l => PB[l[0]] ? `<a class="chip2" href="#/pokemon/${l[0]}">${spr(l[0], 's')}${esc(PB[l[0]].name)}</a>` : '').join('')}</div>`).join(''); }
  if (!AS.cat && !q) { const ms = a => a.map(m => [esc(m.text), m.goals.join(' / '), rw(m.reward)]);
    o += '<h2 class="sec">Missions quotidiennes</h2><p class="cnt">3 missions par jour, tirées au sort (heure d’Espagne). N est l’objectif, X un type tiré au sort.</p>' + TT(['Mission', 'Objectifs possibles', 'Récompense'], ms(W.MIS.daily))
      + '<h2 class="sec">Missions hebdomadaires</h2><p class="cnt">2 missions par semaine.</p>' + TT(['Mission', 'Objectifs possibles', 'Récompense'], ms(W.MIS.weekly)); }
  $('tac').innerHTML = o || '<p class="cnt">Aucun succès ne correspond. Essaie un autre mot ou une autre catégorie.</p>';
}

/* ============ Arceus ============ */
function sim() {
  const t = +$('st').value, s = +$('sp').value || 0, f1 = v => String(+v.toFixed(1)).replace('.', ',');
  const k = Math.min(1.22, .74 + .013 * t) + Math.max(0, t - 300) * .0015, cap = s <= 130 ? s : 130 + (s - 130) * .25;
  const n = t < 1.2 ? 0 : Math.floor((t - 1.2) / 5) + 1, tp = Math.min(1, .4 + Math.max(0, t - 420) / 180 * .6);
  $('stv').textContent = mmss(t) + ' (partie : ' + mmss(1800 + t) + ')';
  $('simo').innerHTML = [['Légendaires apparus', n + (n > 1 ? ` (le dernier a ${f1(Math.pow(1.25, n - 1))} fois les PV et ${f1(Math.pow(1.15, n - 1))} fois les dégâts du 1er)` : '')],
    ['Ta vitesse avec le plafond', cap.toFixed(0)], ['Vitesse d’Arceus', Math.max(70, cap * k).toFixed(0) + ' (' + Math.round(k * 100) + ' % de la tienne)'],
    ['Toucher d’Arceus', Math.round(tp * 100) + ' % de tes PV max'], ['Piliers du Jugement par joueur', 4 + Math.min(6, Math.floor(t / 10))], ['Rayons en croix', t > 30 ? 8 : 4],
    ['Délai entre deux attaques', f1(Math.max(1.4, 3.2 - .025 * t)) + ' s'], ['Dégâts reçus par Arceus', f1(5 / (1 + t / 150)) + ' % de tes dégâts'],
    ['Objets', t >= 300 ? 'brisés par Arceus (minute 35)' : 'intacts (brisés à la minute 35, soit après 5:00 de combat)']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
}
function renderRank() {
  const w = [1, 2, 3].map(i => +$('rw' + i).value); [1, 2, 3].forEach(i => $('rv' + i).textContent = w[i - 1] + ' %');
  const cap = s => s <= 130 ? s : 130 + (s - 130) * .25, sp = P.map(p => cap(p.spd)), dd = P.map(p => (p.df + p.sd) / 2);
  const r = v => [Math.min(...v), Math.max(...v)], rs = r(sp), rd = r(dd), n = (v, a) => (v - a[0]) / (a[1] - a[0]), tot = (w[0] + w[1] + w[2]) || 1;
  const L = P.map((p, i) => ({ p, cs: sp[i], s: (w[0] * n(sp[i], rs) + w[1] * n(p.hp, MM.hp) + w[2] * n(dd[i], rd)) / tot * 100 })).sort((a, b) => b.s - a.s).slice(0, 25);
  $('rkb').innerHTML = L.map((x, i) => `<tr class="row" data-p="${x.p.dex}"><td class="n">${i + 1}</td><td class="nm">${spr(x.p.dex, 's')}${esc(x.p.name)}</td><td>${Math.round(x.cs)}</td><td>${x.p.hp}</td><td>${x.p.df}</td><td>${x.p.sd}</td><td class="tot">${x.s.toFixed(1).replace('.', ',')}</td></tr>`).join('');
}
function renderArceus() {
  $('plq').innerHTML = W.PLATES.map(p => `<span class="chip2" style="cursor:default">${tyB(p[0])}${esc(p[1])}</span>`).join('');
  sim(); renderRank();
}

/* ============ nouveautés ============ */
const KI = { new: '✨', chg: '🔧', fix: '🐛' }, KL = { new: 'Nouveauté', chg: 'Changement', fix: 'Correction' };
const HF = { dmg: ['🗡️', 'Dégâts', 1], cd: ['⏱️', 'Recharge', -1], count: ['🔢', 'Nombre', 1], radius: ['⭕', 'Rayon', 1], max: ['📈', 'Niveau max', 1] };
const dfr = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
function renderNews() {
  const q = nz(NS.q.trim()), N = W.NEWS, c = { new: 0, chg: 0, fix: 0 }; N.forEach(d => d.i.forEach(i => c[i[0]]++));
  $('nvk').innerHTML = [['', `Tout (${c.new + c.chg + c.fix})`], ['new', `✨ Nouveautés (${c.new})`], ['chg', `🔧 Changements (${c.chg})`], ['fix', `🐛 Corrections (${c.fix})`]].map(b => `<button type="button" class="fb" aria-pressed="${NS.k === b[0]}" data-nk="${b[0]}">${b[1]}</button>`).join('');
  let hh = '';
  if (!NS.k || NS.k === 'chg') {
    const g = {}; W.HIST.forEach(x => { const m = MVB[x[1]]; if (!m || (q && !nz(m.fr + ' ' + m.en).includes(q))) return; const key = x[0] + '|' + x[1]; (g[key] = g[key] || { d: x[0], m, c: [] }).c.push(x); });
    const bd = {}; Object.values(g).forEach(x => (bd[x.d] = bd[x.d] || []).push(x));
    hh = Object.keys(bd).sort().reverse().map(d => `<h3 class="h3">${dfr(d)}</h3><div class="hg">${bd[d].map(x => `<div class="hc"><div>${tyB(x.m.type)}<a class="lk" href="#/attaque/${x.m.id}">${esc(mvn(x.m))}</a></div>${x.c.map(r => { const f = HF[r[2]], good = (r[4] > r[3] ? 1 : -1) * f[2] > 0; return `<div class="hr"><span>${f[0]} ${f[1]}</span><span class="ba"><s>${fr1(r[3])}</s> → <b class="${good ? 'up' : 'dn'}">${fr1(r[4])}</b></span></div>`; }).join('')}</div>`).join('')}</div>`).join('');
  }
  $('nvh').innerHTML = hh ? `<details${q ? ' open' : ''}><summary>Avant → après : toutes les attaques rééquilibrées (${W.HIST.length} valeurs modifiées)</summary><p class="cnt" style="margin-top:8px">Vert : l’attaque est renforcée. Rouge : elle est affaiblie. Calculé à partir du code du jeu à chaque mise à jour.</p>${hh}</details>` : '';
  $('nvl').innerHTML = N.map(d => { const L = d.i.filter(i => (!NS.k || i[0] === NS.k) && (!q || nz(i[1]).includes(q))); if (!L.length) return '';
    return `<div class="day"><time datetime="${d.d}">${dfr(d.d)}</time><h2>${esc(d.t)}</h2></div>` + L.map(i => `<div class="nv k-${i[0]}"><span class="ic" title="${KL[i[0]]}" role="img" aria-label="${KL[i[0]]}">${KI[i[0]]}</span><div class="nt">${i[3] ? i[3] + ' ' : ''}${esc(i[1])}${i[2].map(x => ` <span class="ba"><s>${esc(x[0])}</s> → <b>${esc(x[1])}</b></span>`).join('')}</div>${i[4].map(x => spr(x)).join('')}</div>`).join(''); }).join('') || '<p class="cnt">Aucune nouveauté ne correspond. Essaie un autre mot.</p>';
}

/* ============ recherche globale ============ */
function gsearch() {
  const box = $('gres'), q = nz($('gq').value.trim()); if (!q) { box.hidden = true; return; }
  const num = q.replace('#', ''), sec = (t, a) => a.length ? `<h4>${t}</h4>${a.join('')}` : '';
  const ps = P.filter(p => nz(p.fr + ' ' + p.en).includes(q) || String(p.dex) === num).slice(0, 6).map(p => `<a href="#/pokemon/${p.dex}">${spr(p.dex, 's')}<span>${esc(p.name)}</span><small>${pad(p.dex)}</small></a>`);
  const ms = MV.filter(m => nz(m.fr + ' ' + m.en).includes(q)).slice(0, 5).map(m => `<a href="#/attaque/${m.id}">${tyB(m.type)}<span>${esc(mvn(m))}</span><small>${KF[m.kind]}</small></a>`);
  const as = Object.keys(AB).filter(id => nz(AB[id][0] + ' ' + AB[id][1]).includes(q)).slice(0, 5).map(id => `<a href="#/talent/${id}"><span>${esc(abn(id))}</span><small>Talent</small></a>`);
  const it = W.ITEMS.concat(W.ORBS).some(i => nz(i[0]).includes(q)) || W.SHOP.some(s => nz(s[1]).includes(q)) ? ['<a href="#/objets"><span>Objets et boutique</span><small>Section</small></a>'] : [];
  const ss = ROUTES.filter(r => nz(r[1]).includes(q) && r[0] !== 'objets').map(r => `<a href="#/${r[0]}"><span>${r[2]} ${r[1]}</span><small>Section</small></a>`).concat(it);
  box.innerHTML = sec('Pokémon', ps) + sec('Attaques', ms) + sec('Talents', as) + sec('Sections', ss) || '<div class="none">Rien trouvé. Essaie un nom français ou anglais, ou un numéro.</div>';
  const f = box.querySelector('a'); if (f) f.classList.add('cur'); box.hidden = false;
}
function gmove(d) { const a = [...$('gres').querySelectorAll('a')]; if (!a.length) return; let i = a.findIndex(x => x.classList.contains('cur')); a.forEach(x => x.classList.remove('cur')); i = (i + d + a.length) % a.length; a[i].classList.add('cur'); a[i].scrollIntoView({ block: 'nearest' }); }

/* ============ routeur ============ */
const RENDER = { pokedex: renderDex, talents: renderTalents, attaques: renderMoves, types: renderTypes, objets: renderItems, ennemis: renderEnemies, succes: renderAch, arceus: renderArceus, nouveautes: renderNews };
function showSection(name) {
  cur = name;
  ROUTES.forEach(r => { $('s-' + r[0]).hidden = r[0] !== name; });
  document.querySelectorAll('#nav a').forEach(a => { if (a.dataset.r === name) { a.setAttribute('aria-current', 'page'); if (a.scrollIntoView && shown !== name) a.scrollIntoView({ block: 'nearest', inline: 'center' }); } else a.removeAttribute('aria-current'); });
  if (dirty[name]) { RENDER[name](); dirty[name] = false; }
  if (shown !== name) { if (shown) window.scrollTo(0, 0); shown = name; }
  document.title = ROUTES.find(r => r[0] === name)[1] + ' – PokéSurvivor Wiki';
}
function closeToSection() { if (dlg.open) dlg.close(); if (/^#\/(pokemon|attaque|talent|comparer)/.test(location.hash)) setHash('#/' + cur); }
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (/^\d+$/.test(h)) { setHash('#/pokemon/' + h); return route(); }
  if (/^v[\w-]+$/.test(h)) return applyToken(h.slice(1));
  const [a, b] = h.replace(/^\//, '').split('/');
  if (a === 's' && b) return applyToken(b);
  $('gres').hidden = true;
  if (a === 'pokemon' || a === 'attaque' || a === 'talent' || a === 'comparer') {
    showSection(cur);
    if (a === 'pokemon') openP(+b); else if (a === 'attaque') openM(b); else if (a === 'talent') openA(b); else openC();
    return;
  }
  if (dlg.open) dlg.close();
  showSection(RENDER[a] ? a : 'pokedex');
}
function refresh() { ROUTES.forEach(r => dirty[r[0]] = true); P.forEach(p => p.name = LG === 'fr' ? p.fr : p.en); tray(); route(); }

/* ============ partage ============ */
function shareToken() { return btoa(unescape(encodeURIComponent(JSON.stringify({ t: cur, l: LG, v: VIEW, s: S, r: R, s2: S2, m: MS, a: AS, n: NS })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function applyToken(tok) {
  try {
    let b = tok.replace(/-/g, '+').replace(/_/g, '/'); b += '='.repeat((4 - b.length % 4) % 4);
    const o = JSON.parse(decodeURIComponent(escape(atob(b))));
    S = { ...D0, ...(o.s || {}) }; R = o.r || {}; S2 = { q: '', h: '', k: 'dex', d: 1, ...(o.s2 || {}) }; MS = { q: '', ty: '', kd: '', ct: '', k: 'name', d: 1, ...(o.m || {}) };
    AS = { q: '', cat: '', ...(o.a || {}) }; NS = { k: '', q: '', ...(o.n || {}) }; LG = o.l === 'en' ? 'en' : 'fr'; if (o.v === 'cards' || o.v === 'table') VIEW = o.v;
    const t = { '1': 'pokedex', '2': 'talents', '3': 'arceus', '4': 'attaques', '5': 'types', '6': 'objets', '7': 'ennemis', '8': 'succes', '9': 'nouveautes' }[o.t] || o.t;
    syncDexUI(); $('lg').value = LG; $('q2').value = S2.q; $('hf').value = S2.h; $('mq').value = MS.q; $('mty').value = MS.ty; $('mkd').value = MS.kd; $('mct').value = MS.ct; $('aq').value = AS.q; $('acat').value = AS.cat; $('nq').value = NS.q;
    setHash('#/' + (RENDER[t] ? t : 'pokedex'));
  } catch (e) { setHash('#/pokedex'); }
  refresh();
}
function openShare() {
  const url = BASE + '#/s/' + shareToken();
  openDlg(`<div class="hero plain"><div><h2>Partager cette vue</h2><p class="m">Le lien rouvre le wiki sur cette section, avec la langue, les filtres et le tri actuels.</p></div>${closeB}</div><div class="sb"><div class="blk"><label for="shu" class="h3" style="display:block">Lien</label><input id="shu" type="text" readonly value="${esc(url)}" style="width:100%"><div class="acts"><button type="button" class="btn pri" id="shc">Copier le lien</button></div></div></div>`);
  $('shu').select();
}

/* ============ thème ============ */
const TL = { auto: '◐ Auto', light: '☀ Clair', dark: '☾ Sombre' };
function applyTheme() { if (THEME === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = THEME; $('thm').textContent = TL[THEME]; }

/* ============ événements ============ */
function toggleFav(d, btn) {
  if (FV.has(d)) FV.delete(d); else FV.add(d); store.set('fav', [...FV]);
  document.querySelectorAll(`.fv[data-fav="${d}"]`).forEach(b => b.setAttribute('aria-pressed', FV.has(d)));
  if (btn && btn.dataset.lbl) btn.textContent = FV.has(d) ? '★ Retirer des favoris' : '☆ Ajouter aux favoris';
  dirty.types = true; if (cur === 'types') { renderTypes(); dirty.types = false; }
  if (S.fl === 'fav' || S.k === 'fav') { dirty.pokedex = true; if (cur === 'pokedex') { renderDex(); dirty.pokedex = false; } }
  toast(FV.has(d) ? `${PB[d].name} ajouté aux favoris` : `${PB[d].name} retiré des favoris`);
}
const SORT = { dex: [() => S, renderDex, k => (k === 'name' || k === 'types' || k === 'dex') ? 1 : -1], tal: [() => S2, renderTalents, () => 1], mv: [() => MS, renderMoves, k => (k === 'name' || k === 'type' || k === 'kind' || k === 'cat') ? 1 : -1] };
document.addEventListener('click', e => {
  const t = e.target, q = s => t.closest(s);
  let el;
  if (t === dlg || q('[data-close]')) { closeToSection(); return; }
  if ((el = q('[data-fav]'))) { e.preventDefault(); e.stopPropagation(); toggleFav(+el.dataset.fav, el); return; }
  if ((el = q('[data-cmp]'))) { const d = +el.dataset.cmp, i = CMP.indexOf(d); if (i >= 0) CMP.splice(i, 1); else { CMP.push(d); if (CMP.length > 10) CMP.shift(); } tray(); openP(d); toast(i >= 0 ? 'Retiré du comparateur' : `Ajouté au comparateur (${CMP.length}/10)`); return; }
  if ((el = q('[data-uncmp]'))) { CMP.splice(CMP.indexOf(+el.dataset.uncmp), 1); tray(); if (/^#\/comparer/.test(location.hash)) openC(); return; }
  if (q('[data-clrcmp]')) { CMP = []; tray(); if (/^#\/comparer/.test(location.hash)) closeToSection(); return; }
  if ((el = q('[data-step]'))) { if (el.dataset.step) { setHash('#/pokemon/' + el.dataset.step); route(); } return; }
  if ((el = q('[data-go]'))) { location.hash = '#/' + el.dataset.go; return; }
  if ((el = q('[data-sort]'))) { const [get, ren, dir] = SORT[el.dataset.tbl], st = get(), k = el.dataset.sort; if (st.k === k) st.d *= -1; else { st.k = k; st.d = dir(k); } ren(); return; }
  if ((el = q('[data-view]'))) { VIEW = el.dataset.view; store.set('view', VIEW); renderDex(); return; }
  if ((el = q('[data-nk]'))) { NS.k = el.dataset.nk; renderNews(); return; }
  if (t.id === 'shc') { const i = $('shu'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => true, () => { try { return document.execCommand('copy'); } catch (_) { return false; } }).then(ok => { t.textContent = ok ? 'Lien copié' : 'Sélectionné : copie-le à la main'; }); return; }
  if (q('a[href^="#/"]')) { $('gres').hidden = true; if (q('#gres')) $('gq').value = ''; return; }
  if ((el = q('[data-p]'))) { location.hash = '#/pokemon/' + el.dataset.p; return; }
  if ((el = q('[data-href]'))) { location.hash = el.dataset.href; return; }
  if (!q('.gs')) $('gres').hidden = true;
});
document.addEventListener('change', e => { if (e.target.id === 'ns') { NSEL = +e.target.value; openP(+e.target.dataset.p); const n = $('ns'); if (n) { n.focus(); n.scrollIntoView({ block: 'center' }); } } });
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'select' || tag === 'textarea';
  if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (dlg.open) closeToSection(); $('gq').focus(); return; }
  if (e.target.id === 'gq') {
    if (e.key === 'ArrowDown') { e.preventDefault(); gmove(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); gmove(-1); }
    else if (e.key === 'Enter') { const a = $('gres').querySelector('a.cur'); if (a && !$('gres').hidden) { location.hash = a.getAttribute('href'); $('gres').hidden = true; e.target.value = ''; e.target.blur(); } }
    else if (e.key === 'Escape') { $('gres').hidden = true; }
    return;
  }
  if (dlg.open && !typing && /^#\/pokemon\//.test(location.hash)) {
    const b = e.key === 'ArrowLeft' ? cd.querySelector('.pn [data-step]') : e.key === 'ArrowRight' ? cd.querySelectorAll('.pn [data-step]')[1] : null;
    if (b && b.dataset.step) { setHash('#/pokemon/' + b.dataset.step); route(); }
  }
});
dlg.addEventListener('close', () => { if (/^#\/(pokemon|attaque|talent|comparer)/.test(location.hash)) setHash('#/' + cur); });
window.addEventListener('hashchange', route);

function bind(id, obj, key, ren, ev) { const f = debounce(() => { obj()[key] = $(id).value; ren(); }, ev === 'change' ? 0 : 130); $(id).addEventListener(ev || 'input', f); }
bind('q', () => S, 'q', renderDex); bind('gen', () => S, 'gen', renderDex, 'change'); bind('ty', () => S, 'ty', renderDex, 'change'); bind('fl', () => S, 'fl', renderDex, 'change');
bind('q2', () => S2, 'q', renderTalents); bind('hf', () => S2, 'h', renderTalents, 'change');
bind('mq', () => MS, 'q', renderMoves); bind('mty', () => MS, 'ty', renderMoves, 'change'); bind('mkd', () => MS, 'kd', renderMoves, 'change'); bind('mct', () => MS, 'ct', renderMoves, 'change');
bind('aq', () => AS, 'q', renderAch); bind('acat', () => AS, 'cat', renderAch, 'change'); bind('nq', () => NS, 'q', renderNews);
$('gq').addEventListener('input', debounce(gsearch, 90)); $('gq').addEventListener('focus', gsearch);
$('rgg').addEventListener('input', debounce(e => { const k = e.target.dataset.r; if (!k) return; const v = e.target.value === '' ? null : parseFloat(e.target.value.replace(',', '.')); (R[k] = R[k] || [null, null])[+e.target.dataset.m] = v; renderDex(); }));
$('rs').addEventListener('click', () => { S = { ...D0 }; R = {}; syncDexUI(); renderDex(); });
$('csv').addEventListener('click', exportCsv);
$('em').addEventListener('input', scaleSim);
$('st').addEventListener('input', sim); $('sp').addEventListener('input', sim); [1, 2, 3].forEach(i => $('rw' + i).addEventListener('input', renderRank));
$('lg').addEventListener('change', e => { LG = e.target.value; store.set('lang', LG); refresh(); });
$('thm').addEventListener('click', () => { THEME = { auto: 'light', light: 'dark', dark: 'auto' }[THEME]; store.set('theme', THEME); applyTheme(); });
$('shr').addEventListener('click', openShare);

/* ============ démarrage ============ */
$('nav').innerHTML = ROUTES.map(r => `<a href="#/${r[0]}" data-r="${r[0]}"><span class="ni" aria-hidden="true">${r[2]}</span>${r[1]}</a>`).join('');
$('gen').innerHTML = '<option value="">Toutes les générations</option>' + RG.slice(1).map((r, i) => `<option value="${i + 1}">Génération ${i + 1} (${r})</option>`).join('');
const tyOpts = '<option value="">Tous les types</option>' + TY.map(t => `<option value="${t}">${TF[t]}</option>`).join('');
$('ty').innerHTML = tyOpts; $('mty').innerHTML = tyOpts;
$('mkd').innerHTML = '<option value="">Tous les genres</option>' + Object.keys(KF).map(k => `<option value="${k}">${KF[k]}</option>`).join('');
$('acat').innerHTML = '<option value="">Toutes les catégories</option>' + W.ACHCATS.map(c => `<option value="${c[0]}">${esc(c[1])}</option>`).join('');
$('rgg').innerHTML = ST.map(([k, l]) => `<label><span>${l}</span><input type="number" step="any" inputmode="decimal" placeholder="min" aria-label="${l} minimum" data-r="${k}" data-m="0"><input type="number" step="any" inputmode="decimal" placeholder="max" aria-label="${l} maximum" data-r="${k}" data-m="1"></label>`).join('');
$('asof').textContent = dfr(W.NEWS[0].d);
$('lg').value = LG; applyTheme();
P.forEach(p => p.name = LG === 'fr' ? p.fr : p.en);
try { if (window.claude && window.claude.use) window.claude.use('downloads').then(d => { DL = d || null; }).catch(() => {}); } catch (_) {}
tray(); route();
})();
