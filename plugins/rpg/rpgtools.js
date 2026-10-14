/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import * as R from '../../lib/rpg.js'

const T = { tags: ['rpg'] }
const nf = (n) => Number(n).toLocaleString('id-ID')
const hasCd = (p, action, sec, notifReply) => {
    const left = R.useCooldown(p, action, sec)
    if (left) { notifReply(`⏳ Tunggu ${left} detik lagi sebelum ${action} lagi.`, 'RPG'); return true }
    return false
}
const tired = (p, notifReply) => {
    if (p.health >= 15) return false
    notifReply(`💔 Nyawa terlalu rendah (${p.health}). Pakai ${'.'}buy potion atau tunggu .daily.`, 'RPG')
    return true
}
const gain = (p, xp) => { const up = R.addXp(p, xp); return up ? `\n🎉 Naik level! Sekarang Lv.${p.level}` : '' }
const save = () => R.saveRpg()

// Aksi petualangan generik
const adventure = (name, desc, { cd, hpCost, table, xp }) => cmd({ command: [name], desc, ...T, title: name }, async (m, { notifReply }) => {
    const p = R.getPlayer(m.sender)
    if (tired(p, notifReply) || hasCd(p, name, cd, notifReply)) return
    const found = []
    for (const [item, chance, min, max] of table) if (Math.random() < chance) { const n = R.rand(min, max); R.addItem(p, item, n); found.push(`${R.RESOURCES[item].name} x${n}`) }
    const cost = Math.max(1, R.rand(hpCost[0], hpCost[1]) - Math.floor(R.defense(p) / 4))
    p.health = Math.max(1, p.health - cost)
    const x = R.rand(xp[0], xp[1])
    const extra = gain(p, x)
    save()
    await notifReply(box(name.toUpperCase(), [found.length ? `Dapat : ${found.join(', ')}` : 'Dapat : tidak ada hasil kali ini', `XP    : +${x}`, `Nyawa : -${cost} (${p.health}/${R.maxHealth(p)})`]) + extra, 'RPG')
})

const resolveItem = (input) => {
    const k = String(input || '').toLowerCase().replace(/\s+/g, '_')
    return R.ALL_ITEMS[k] ? k : Object.keys(R.ALL_ITEMS).find(key => R.ALL_ITEMS[key].name.toLowerCase().replace(/\s+/g, '_') === k) || null
}

const profileText = (jid, p) => box('RPG PROFILE', [
    `Nama   : ${R.displayName(jid)}`,
    `Level  : ${p.level} (${p.xp}/${R.xpNeed(p.level)} XP)`,
    `Nyawa  : ${p.health}/${R.maxHealth(p)}  ${R.bar(p.health, R.maxHealth(p))}`,
    `Gold   : ${nf(p.gold)}`,
    `Attack : ${R.attack(p)}   Defense: ${R.defense(p)}`,
    `Senjata: ${p.weapon ? `${R.WEAPONS[p.weapon].name} +${p.weaponLv}` : '-'}`,
    `Armor  : ${p.armor ? `${R.ARMORS[p.armor].name} +${p.armorLv}` : '-'}`,
    `Battle : ${p.wins}W / ${p.losses}L`
])

const list = [
    cmd({ command: ['rpg'], desc: 'Panduan RPG', ...T, title: 'RPG' }, async (m, { prefix, notifReply }) => {
        const p = R.getPlayer(m.sender); save()
        const x = pfxOf(prefix)
        await notifReply(`⚔️ *RPG SAKURA-MD* (gold virtual, bukan uang asli)\n\nMulai: ${x}daily, ${x}work, ${x}hunt, ${x}fish, ${x}mine, ${x}explore, ${x}battle\nToko: ${x}buy <item> | ${x}sell <item> [jumlah|all]\nPerlengkapan: ${x}equip, ${x}unequip, ${x}upgrade\nInfo: ${x}profile ${x}inventory ${x}stats ${x}balance ${x}level\nPeringkat: ${x}rpgleaderboard ${x}richest ${x}levelboard\n\n${profileText(m.sender, p)}`, 'RPG')
    }),

    cmd({ command: ['profile', 'rpgprofile'], desc: 'Profil RPG', ...T, title: 'Profile' }, async (m, { notifReply }) => { const p = R.getPlayer(m.sender); save(); await notifReply(profileText(m.sender, p), 'Profile') }),

    cmd({ command: ['inventory', 'inv'], desc: 'Isi inventory', ...T, title: 'Inventory' }, async (m, { notifReply }) => {
        const p = R.getPlayer(m.sender); save()
        const items = Object.entries(p.inventory).map(([k, n]) => `• ${R.ALL_ITEMS[k]?.name || k} x${n}`)
        await notifReply(box('INVENTORY', items.length ? items : ['(kosong)']), 'Inventory')
    }),

    cmd({ command: ['stats'], desc: 'Statistik karakter', ...T, title: 'Stats' }, async (m, { notifReply }) => {
        const p = R.getPlayer(m.sender)
        await notifReply(box('STATS', [`Attack  : ${R.attack(p)}`, `Defense : ${R.defense(p)}`, `Max HP  : ${R.maxHealth(p)}`, `Menang  : ${p.wins}`, `Kalah   : ${p.losses}`]), 'Stats')
    }),

    cmd({ command: ['balance', 'bal', 'gold'], desc: 'Saldo gold virtual', ...T, title: 'Balance' }, async (m, { notifReply }) => { const p = R.getPlayer(m.sender); save(); await notifReply(`💰 Gold: *${nf(p.gold)}*`, 'Balance') }),

    cmd({ command: ['level'], desc: 'Level & progres XP', ...T, title: 'Level' }, async (m, { notifReply }) => { const p = R.getPlayer(m.sender); await notifReply(`⭐ Level ${p.level}\n${R.bar(p.xp, R.xpNeed(p.level))} ${p.xp}/${R.xpNeed(p.level)} XP`, 'Level') }),
    cmd({ command: ['exp', 'xp'], desc: 'XP saat ini', ...T, title: 'EXP' }, async (m, { notifReply }) => { const p = R.getPlayer(m.sender); await notifReply(`✨ XP: ${p.xp}/${R.xpNeed(p.level)} (Lv.${p.level})`, 'EXP') }),

    cmd({ command: ['daily'], desc: 'Hadiah harian', ...T, title: 'Daily' }, async (m, { notifReply }) => {
        const p = R.getPlayer(m.sender)
        const since = Date.now() - p.lastDaily
        if (since < 86400000) { const h = Math.ceil((86400000 - since) / 3600000); return notifReply(`⏳ Hadiah harian sudah diambil. Coba lagi ±${h} jam lagi.`, 'Daily') }
        p.streak = since < 172800000 ? p.streak + 1 : 1
        const gold = 300 + Math.min(p.streak, 7) * 50
        p.gold += gold; p.lastDaily = Date.now(); p.health = R.maxHealth(p)
        const extra = gain(p, 40); save()
        await notifReply(box('DAILY', [`Gold  : +${nf(gold)}`, `XP    : +40`, `Streak: ${p.streak} hari`, 'Nyawa dipulihkan penuh']) + extra, 'Daily')
    }),

    cmd({ command: ['work', 'kerja'], desc: 'Kerja dapat gold', ...T, title: 'Work' }, async (m, { notifReply }) => {
        const p = R.getPlayer(m.sender)
        if (hasCd(p, 'work', 300, notifReply)) return
        const jobs = ['mengantar paket', 'menjaga toko', 'membantu di ladang', 'menjadi kurir', 'membersihkan taman']
        const gold = R.rand(40, 100) + p.level * 5
        p.gold += gold; const extra = gain(p, R.rand(8, 15)); save()
        await notifReply(`💼 Kamu ${jobs[R.rand(0, jobs.length - 1)]} dan dapat *${nf(gold)}* gold.${extra}`, 'Work')
    }),

    adventure('hunt', 'Berburu (daging)', { cd: 60, hpCost: [5, 15], xp: [12, 25], table: [['daging', 0.9, 1, 3]] }),
    adventure('fish', 'Memancing (ikan)', { cd: 45, hpCost: [1, 5], xp: [8, 16], table: [['ikan', 0.85, 1, 4], ['permata', 0.03, 1, 1]] }),
    adventure('mine', 'Menambang (batu/bijih)', { cd: 75, hpCost: [6, 14], xp: [14, 28], table: [['batu', 0.95, 2, 5], ['besi', 0.45, 1, 3], ['emas', 0.15, 1, 2], ['permata', 0.04, 1, 1]] }),
    adventure('explore', 'Menjelajah (campuran)', { cd: 90, hpCost: [8, 20], xp: [20, 40], table: [['daging', 0.3, 1, 2], ['ikan', 0.3, 1, 2], ['besi', 0.3, 1, 2], ['emas', 0.2, 1, 1], ['permata', 0.08, 1, 1]] }),

    cmd({ command: ['sell', 'jual'], desc: 'Jual hasil: .sell <item> [jumlah|all]', ...T, title: 'Sell' }, async (m, { args, prefix, notifReply }) => {
        const p = R.getPlayer(m.sender)
        if (String(args[0] || '').toLowerCase() === 'all') {
            let total = 0
            for (const [k, n] of Object.entries(p.inventory)) if (R.RESOURCES[k]) { total += R.RESOURCES[k].sell * n; delete p.inventory[k] }
            if (!total) return notifReply('Tidak ada hasil buruan/tambang untuk dijual.', 'Sell')
            p.gold += total; save()
            return notifReply(`💰 Semua hasil terjual: +${nf(total)} gold`, 'Sell')
        }
        const key = resolveItem(args[0])
        if (!key || !R.RESOURCES[key]) return notifReply(`Contoh: ${pfxOf(prefix)}sell ikan 3\natau ${pfxOf(prefix)}sell all\nBisa dijual: ${Object.keys(R.RESOURCES).join(', ')}`, 'Sell')
        const have = p.inventory[key] || 0
        const n = args[1] === 'all' || !args[1] ? have : Math.floor(Number(args[1]))
        if (!Number.isInteger(n) || n < 1) return notifReply('Jumlah tidak valid.', 'Sell')
        if (n > have) return notifReply(`Kamu hanya punya ${have} ${R.RESOURCES[key].name}.`, 'Sell')
        R.takeItem(p, key, n); const g = R.RESOURCES[key].sell * n; p.gold += g; save()
        await notifReply(`💰 ${R.RESOURCES[key].name} x${n} terjual: +${nf(g)} gold`, 'Sell')
    }),

    cmd({ command: ['buy', 'beli'], desc: 'Toko: .buy <item> [jumlah]', ...T, title: 'Buy' }, async (m, { args, prefix, notifReply }) => {
        const p = R.getPlayer(m.sender)
        const shop = { ...R.WEAPONS, ...R.ARMORS, ...R.CONSUMABLES }
        const key = resolveItem(args[0])
        if (!key || !shop[key]) {
            const lines = Object.entries(shop).map(([k, v]) => `• ${k} — ${nf(v.price)} gold${v.atk ? ` (ATK +${v.atk})` : v.def ? ` (DEF +${v.def})` : ` (+${v.heal} HP)`}`)
            return notifReply(`🛒 *Toko*\n${lines.join('\n')}\n\nContoh: ${pfxOf(prefix)}buy potion 2`, 'Buy')
        }
        const n = shop[key].heal ? Math.max(1, Math.min(20, Math.floor(Number(args[1])) || 1)) : 1
        const cost = shop[key].price * n
        if (p.gold < cost) return notifReply(`Gold kurang. Butuh ${nf(cost)}, kamu punya ${nf(p.gold)}.`, 'Buy')
        if (!shop[key].heal && (p.inventory[key] || 0) > 0) return notifReply('Kamu sudah punya item itu.', 'Buy')
        p.gold -= cost; R.addItem(p, key, n); save()
        await notifReply(`✅ Membeli ${shop[key].name} x${n} (-${nf(cost)} gold).${shop[key].heal ? '\nPakai: .heal' : '\nPasang: .equip ' + key}`, 'Buy')
    }),

    cmd({ command: ['heal', 'potion'], desc: 'Pakai potion (+50 HP)', ...T, title: 'Heal' }, async (m, { notifReply }) => {
        const p = R.getPlayer(m.sender)
        if (p.health >= R.maxHealth(p)) return notifReply('Nyawa sudah penuh.', 'Heal')
        if (!R.takeItem(p, 'potion')) return notifReply('Kamu tidak punya potion. Beli: .buy potion', 'Heal')
        p.health = Math.min(R.maxHealth(p), p.health + R.CONSUMABLES.potion.heal); save()
        await notifReply(`🧪 Nyawa: ${p.health}/${R.maxHealth(p)}`, 'Heal')
    }),

    cmd({ command: ['equip', 'pasang'], desc: 'Pasang senjata/armor', ...T, title: 'Equip' }, async (m, { args, prefix, notifReply }) => {
        const p = R.getPlayer(m.sender)
        const key = resolveItem(args[0])
        if (!key || !(R.WEAPONS[key] || R.ARMORS[key])) return notifReply(`Contoh: ${pfxOf(prefix)}equip pedang_besi`, 'Equip')
        if (!p.inventory[key]) return notifReply('Kamu tidak punya item itu.', 'Equip')
        if (R.WEAPONS[key]) { p.weapon = key; p.weaponLv = 0 } else { p.armor = key; p.armorLv = 0 }
        save()
        await notifReply(`✅ ${(R.WEAPONS[key] || R.ARMORS[key]).name} terpasang.`, 'Equip')
    }),
    cmd({ command: ['unequip', 'lepas'], desc: 'Lepas weapon/armor', ...T, title: 'Unequip' }, async (m, { args, prefix, notifReply }) => {
        const p = R.getPlayer(m.sender)
        const slot = String(args[0] || '').toLowerCase()
        if (!['weapon', 'armor'].includes(slot)) return notifReply(`Contoh: ${pfxOf(prefix)}unequip weapon|armor`, 'Unequip')
        if (!p[slot]) return notifReply('Slot itu kosong.', 'Unequip')
        p[slot] = null; p[`${slot}Lv`] = 0; save()
        await notifReply(`✅ ${slot} dilepas (level upgrade slot direset).`, 'Unequip')
    }),

    cmd({ command: ['upgrade'], desc: 'Upgrade weapon/armor terpasang (maks +10)', ...T, title: 'Upgrade' }, async (m, { args, prefix, notifReply }) => {
        const p = R.getPlayer(m.sender)
        const slot = String(args[0] || '').toLowerCase()
        if (!['weapon', 'armor'].includes(slot)) return notifReply(`Contoh: ${pfxOf(prefix)}upgrade weapon|armor`, 'Upgrade')
        if (!p[slot]) return notifReply('Pasang dulu item di slot itu (.equip).', 'Upgrade')
        const lvKey = `${slot}Lv`
        if (p[lvKey] >= 10) return notifReply('Sudah level maksimal (+10).', 'Upgrade')
        const cost = 200 * (p[lvKey] + 1)
        if (p.gold < cost) return notifReply(`Gold kurang. Butuh ${nf(cost)}.`, 'Upgrade')
        if (!R.takeItem(p, 'besi', 2)) return notifReply('Butuh 2 Bijih Besi (hasil .mine).', 'Upgrade')
        p.gold -= cost; p[lvKey]++; save()
        await notifReply(`🔨 Upgrade berhasil! ${slot} kini +${p[lvKey]} (-${nf(cost)} gold, -2 Bijih Besi)`, 'Upgrade')
    }),

    cmd({ command: ['battle', 'lawan'], desc: 'Lawan monster (PvE)', ...T, title: 'Battle' }, async (m, { notifReply }) => {
        const p = R.getPlayer(m.sender)
        if (tired(p, notifReply) || hasCd(p, 'battle', 60, notifReply)) return
        const names = ['Goblin', 'Serigala', 'Bandit', 'Golem Batu', 'Orc']
        const mon = { name: names[R.rand(0, names.length - 1)], hp: 40 + p.level * 18, atk: 4 + p.level * 2 }
        const startHp = mon.hp
        const log = []
        let round = 0
        while (mon.hp > 0 && p.health > 0 && round < 30) {
            round++
            const dmg = Math.max(1, R.attack(p) + R.rand(-2, 3) - Math.floor(mon.atk / 6))
            mon.hp -= dmg
            if (mon.hp <= 0) break
            p.health -= Math.max(1, mon.atk + R.rand(-2, 2) - R.defense(p))
        }
        let extra = ''
        if (mon.hp <= 0) {
            const gold = R.rand(30, 60) + p.level * 6, xp = R.rand(25, 45) + p.level * 3
            p.gold += gold; p.wins++; p.health = Math.max(1, p.health); extra = gain(p, xp)
            log.push(`🏆 Menang lawan ${mon.name} (${round} ronde)`, `Gold: +${nf(gold)}   XP: +${xp}`)
        } else {
            const lost = Math.min(p.gold, Math.floor(p.gold * 0.08))
            p.gold -= lost; p.losses++; p.health = 1
            log.push(`💀 Kalah dari ${mon.name}`, `Gold hilang: -${nf(lost)}`, 'Nyawa tersisa 1. Pulihkan dengan potion/.daily.')
        }
        log.push(`Nyawa: ${Math.max(0, p.health)}/${R.maxHealth(p)}`)
        save()
        await notifReply(box('BATTLE', log) + extra, 'Battle')
    }),

    cmd({ command: ['rpgleaderboard', 'rpglb'], desc: 'Peringkat power', ...T, title: 'Leaderboard' }, async (m, { notifReply }) => {
        const top = R.topBy(p => R.attack(p) + R.defense(p) + p.level * 5)
        await notifReply(box('TOP POWER', top.map((t, i) => `${i + 1}. ${R.displayName(t.jid)} — ${t.v}`)), 'Leaderboard')
    }),
    cmd({ command: ['richest', 'toprich'], desc: 'Peringkat gold', ...T, title: 'Richest' }, async (m, { notifReply }) => {
        const top = R.topBy(p => p.gold)
        await notifReply(box('TOP GOLD', top.map((t, i) => `${i + 1}. ${R.displayName(t.jid)} — ${nf(t.v)}`)), 'Richest')
    }),
    cmd({ command: ['levelboard', 'toplevel'], desc: 'Peringkat level', ...T, title: 'Level Board' }, async (m, { notifReply }) => {
        const top = R.topBy(p => p.level * 100000 + p.xp)
        await notifReply(box('TOP LEVEL', top.map((t, i) => `${i + 1}. ${R.displayName(t.jid)} — Lv.${t.p.level}`)), 'Level Board')
    })
]

export default list[0]
export const handlers = list.slice(1)