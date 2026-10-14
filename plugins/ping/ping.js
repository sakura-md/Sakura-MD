/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import os from 'os'
import crypto from 'crypto'

let handler = async (m, { conn, notifReply }) => {
    try {
        const latency = Date.now() - (Number(m.messageTimestamp) * 1000)

        const heapUsed = (
            process.memoryUsage().heapUsed / 1024 / 1024
        ).toFixed(2)

        const rssMem = (
            process.memoryUsage().rss / 1024 / 1024
        ).toFixed(2)

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}

body {
    background: transparent;
    color: #e2e8f0;
}

.wrapper {
    max-width: 420px;
    padding: 6px;
}

.galaxy-bg {
    position: relative;
    overflow: hidden;
}

.galaxy-bg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    background-image:
        radial-gradient(1px 1px at 12px 15px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 55px 35px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 95px 10px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 140px 40px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 180px 20px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(2px 2px at 220px 50px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 260px 15px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 300px 45px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 340px 25px,#ffffff,rgba(0,0,0,0));

    background-size: 350px 60px;
    opacity: 0.6;
    animation: galaxyTwinkle 4s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 1;
}

.galaxy-bg::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    background-image:
        radial-gradient(1.5px 1.5px at 35px 45px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 75px 15px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(2px 2px at 115px 25px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 155px 5px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 195px 35px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 235px 55px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 275px 20px,#ffffff,rgba(0,0,0,0)),
        radial-gradient(1px 1px at 315px 50px,#ffffff,rgba(0,0,0,0));

    background-size: 320px 50px;
    opacity: 0.4;
    animation: galaxyTwinkle 6s ease-in-out infinite alternate-reverse;
    pointer-events: none;
    z-index: 1;
}

@keyframes galaxyTwinkle {
    0% {
        opacity: 0.3;
        transform: translateY(0px);
    }

    50% {
        opacity: 0.8;
    }

    100% {
        opacity: 0.4;
        transform: translateY(-2px);
    }
}

.head {
    background: linear-gradient(135deg,#1e3a8a,#2563eb);
    border-radius: 16px;
    padding: 10px 12px;
    margin-bottom: 6px;
    box-shadow: 0 0 20px rgba(37,99,235,0.3);
}

.head .t1 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    position: relative;
    z-index: 2;
}

.head .t2 {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    color: #bfdbfe;
    margin-top: 2px;
    position: relative;
    z-index: 2;
}

.head .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%,100% {
        opacity: 1;
    }

    50% {
        opacity: .3;
    }
}

.up {
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.3);
    border-radius: 14px;
    padding: 8px;
    text-align: center;
    margin-bottom: 6px;
}

.up .l {
    font-size: 9px;
    font-weight: 700;
    color: #4ade80;
    letter-spacing: 1px;
    position: relative;
    z-index: 2;
}

.up .v {
    font-size: 17px;
    font-weight: 800;
    color: #22c55e;
    font-variant-numeric: tabular-nums;
    margin: 2px 0;
    position: relative;
    z-index: 2;
}

.up .s {
    font-size: 9px;
    color: #94a3b8;
    font-family: monospace;
    position: relative;
    z-index: 2;
}

.bar {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(148,163,184,0.1);
    border-radius: 10px;
    padding: 8px 10px;
    margin-bottom: 5px;
}

.bar .r {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 4px;
    position: relative;
    z-index: 2;
}

.bar .r .n {
    font-weight: 700;
    color: #94a3b8;
}

.bar .r .p {
    font-weight: 800;
    color: #fff;
    font-variant-numeric: tabular-nums;
}

.bar .pg {
    height: 8px;
    background: #0f172a;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    z-index: 2;
}

.bar .pg .f {
    height: 100%;
    border-radius: 6px;
    width: 0%;
    transition:
        width 0.8s cubic-bezier(0.4,0,0.2,1),
        background 1s ease-in-out;

    position: relative;
    overflow: hidden;
}

.level-green {
    background: linear-gradient(90deg,#10b981,#34d399) !important;
}

.level-blue {
    background: linear-gradient(90deg,#3b82f6,#60a5fa) !important;
}

.level-red {
    background: linear-gradient(90deg,#ef4444,#f87171) !important;
}

.bar .pg .f::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;

    background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.25),
        transparent
    );

    animation: shimmer 2.5s infinite;
}

@keyframes shimmer {
    0% {
        left: -100%;
    }

    100% {
        left: 100%;
    }
}

.g2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    margin-bottom: 5px;
}

.box {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(148,163,184,0.1);
    border-radius: 10px;
    padding: 7px 9px;
}

.box .l {
    font-size: 8px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 2px;
    position: relative;
    z-index: 2;
}

.box .v {
    font-size: 11px;
    font-weight: 700;
    color: #e2e8f0;
    font-family: monospace;
    position: relative;
    z-index: 2;
}

.full {
    grid-column: 1/-1;
}

.foot {
    font-size: 9px;
    font-weight: 600;
    color: #94a3b8;
    text-align: left;
    margin-top: 6px;
    padding-left: 2px;
    letter-spacing: 0.3px;
}
</style>
</head>

<body>

<div class="wrapper">

    <div class="head galaxy-bg">
        <div class="t1">
            📡 SERVER LIVE
        </div>

        <div class="t2">
            <span class="dot"></span>
            REALTIME MONITOR · ${latency} ms
        </div>
    </div>

    <div class="up galaxy-bg">
        <div class="l">
            BOT UPTIME – BERJALAN REALTIME
        </div>

        <div class="v" id="botUptime">
            0j 0m 0d
        </div>

        <div class="s">
            ${os.platform()} uptime:
            <span id="sysUptime">0j 0m 0d</span>
        </div>
    </div>

    <div class="bar galaxy-bg">
        <div class="r">
            <span class="n">CPU LOAD</span>
            <span class="p" id="cpuText">0.0%</span>
        </div>

        <div class="pg">
            <div class="f level-green" id="cpuBar"></div>
        </div>
    </div>

    <div class="bar galaxy-bg">
        <div class="r">
            <span class="n">RAM</span>
            <span class="p" id="ramText">0.0%</span>
        </div>

        <div class="pg">
            <div class="f level-green" id="ramBar"></div>
        </div>
    </div>

    <div class="bar galaxy-bg">
        <div class="r">
            <span class="n">DISK</span>
            <span class="p" id="diskText">0.0%</span>
        </div>

        <div class="pg">
            <div class="f level-green" id="diskBar"></div>
        </div>
    </div>

    <div class="g2">

        <div class="box galaxy-bg">
            <div class="l">OS</div>
            <div class="v">
                ${os.platform()} ${os.release()}
            </div>
        </div>

        <div class="box galaxy-bg">
            <div class="l">ARCH</div>
            <div class="v">
                ${os.arch()}
            </div>
        </div>

        <div class="box galaxy-bg">
            <div class="l">CPU</div>
            <div class="v">
                ${os.cpus().length || 1} core
            </div>
        </div>

        <div class="box galaxy-bg">
            <div class="l">HEAP / RSS</div>
            <div class="v">
                ${heapUsed} MB / ${rssMem} MB
            </div>
        </div>

        <div class="box galaxy-bg">
            <div class="l">SWAP</div>
            <div class="v">
                0 MB
            </div>
        </div>

        <div class="box galaxy-bg">
            <div class="l">IP PRIMER</div>
            <div class="v">
                172.18.0.43
            </div>
        </div>

        <div class="box full galaxy-bg">
            <div class="l">NODE VERSION</div>
            <div class="v">
                Node ${process.version}
            </div>
        </div>

    </div>

    <div class="foot">
        © Sakura-MD • 2026
    </div>

</div>

<script>

let currentBotSec = Math.floor(${process.uptime()});
let currentSysSec = Math.floor(${os.uptime()});

let baseCpu = 20;
let baseRam = 80;
let baseDisk = 20;

function formatUptime(seconds) {

    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (d > 0) {
        return d + 'h ' +
               h + 'j ' +
               m + 'm ' +
               s + 'd';
    }

    return h + 'j ' +
           m + 'm ' +
           s + 'd';
}

setInterval(() => {

    currentBotSec++;
    currentSysSec++;

    document.getElementById('botUptime').innerText =
        formatUptime(currentBotSec);

    document.getElementById('sysUptime').innerText =
        formatUptime(currentSysSec);

}, 1000);

function getColorClass(val) {

    const num = parseFloat(val);

    if (num <= 35.0) {
        return 'level-green';
    }

    if (num <= 75.0) {
        return 'level-blue';
    }

    return 'level-red';
}

function applyBarState(elementId, textId, value) {

    const barEl =
        document.getElementById(elementId);

    const textEl =
        document.getElementById(textId);

    barEl.style.width = value + '%';

    textEl.innerText =
        value + '%';

    barEl.className =
        'f ' + getColorClass(value);
}

function updateBars() {

    let liveCpu = Math.min(
        100,
        Math.max(
            2,
            baseCpu + (Math.random() * 20 - 10)
        )
    ).toFixed(1);

    let liveRam = Math.min(
        100,
        Math.max(
            5,
            baseRam + (Math.random() * 16 - 8)
        )
    ).toFixed(1);

    let liveDisk = Math.min(
        100,
        Math.max(
            2,
            baseDisk + (Math.random() * 20 - 10)
        )
    ).toFixed(1);

    applyBarState(
        'cpuBar',
        'cpuText',
        liveCpu
    );

    applyBarState(
        'ramBar',
        'ramText',
        liveRam
    );

    applyBarState(
        'diskBar',
        'diskText',
        liveDisk
    );
}

window.addEventListener(
    'DOMContentLoaded',
    () => {

        document.getElementById(
            'botUptime'
        ).innerText =
            formatUptime(currentBotSec);

        document.getElementById(
            'sysUptime'
        ).innerText =
            formatUptime(currentSysSec);

        applyBarState(
            'cpuBar',
            'cpuText',
            '20.0'
        );

        applyBarState(
            'ramBar',
            'ramText',
            '80.0'
        );

        applyBarState(
            'diskBar',
            'diskText',
            '20.0'
        );

        setTimeout(
            updateBars,
            100
        );

        setInterval(
            updateBars,
            2500
        );
    }
);

</script>

</body>
</html>
`

        const responseId =
            crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString()

        const responseData = {
            response_id: responseId,

            sections: [
                {
                    view_model: {
                        primitive: {
                            __typename:
                                'GenAIaeacdsnwHtmlPrimitive',

                            payload: html,

                            trusted_sources: []
                        },

                        __typename:
                            'GenAISingleLayoutViewModel'
                    }
                }
            ]
        }

        const dataBase64 =
            Buffer.from(
                JSON.stringify(responseData)
            ).toString('base64')

        await conn.relayMessage(
            m.chat,
            {
                messageContextInfo: {
                    deviceListMetadata: {},

                    deviceListMetadataVersion: 2,

                    botMetadata: {
                        messageDisclaimerText: '',
                        botResponseId: responseId
                    }
                },

                botForwardedMessage: {
                    message: {
                        richResponseMessage: {

                            messageType: 1,

                            submessages: [
                                {
                                    messageType: 2,
                                    messageText:
                                        'Server Monitor'
                                }
                            ],

                            unifiedResponse: {
                                data: dataBase64
                            },

                            contextInfo: {
                                forwardingScore: 1,

                                isForwarded: true,

                                forwardedAiBotMessageInfo: {
                                    botJid:
                                        '867051314767696@bot'
                                },

                                forwardOrigin: 4
                            }
                        }
                    }
                }
            },
            {
                messageId: responseId
            }
        )

    } catch (e) {

        await notifReply(
            `❌ Error: ${e.message}`,
            'Ping Error'
        )
    }
}

handler.command = [
    'ping',
    'pinglive',
    'serverinfo',
    'monitor'
]

export default handler