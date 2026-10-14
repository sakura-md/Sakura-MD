/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { Buffer } from 'buffer'
import { projectRoot } from '../../handler.js'
import { sendInapp } from '../../lib/inapp.js'

function tree(dir, prefix = '') {
    let output = ''

    let items = fs.readdirSync(dir, {
        withFileTypes: true
    })
    .filter(item => {
        const n = item.name.toLowerCase()

        if (n === 'node_modules') return false
        if (n === '.git') return false
        if (n.startsWith('.')) return false

        // Jangan masuk / membaca session
        if (n === 'session') return false
        if (n === 'sessions') return false

        // File sensitif
        if (n === 'prekey.json') return false
        if (n.startsWith('pre-key')) return false
        if (n.startsWith('app-state-sync-key')) return false
        if (n.startsWith('app-state-sync-version')) return false

        return true
    })
    .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
            return a.isDirectory() ? -1 : 1
        }

        return a.name.localeCompare(b.name)
    })

    items.forEach((item, index) => {
        const last = index === items.length - 1

        const branch = last
            ? '└── '
            : '├── '

        output += `${prefix}${branch}${item.name}\n`

        if (item.isDirectory()) {
            output += tree(
                path.join(dir, item.name),
                prefix + (last ? '    ' : '│   ')
            )
        }
    })

    return output
}

let handler = async (m, { conn }) => {
    try {
        let structure = tree(projectRoot)

        if (!structure.trim()) {
            return sendInapp(conn, m, '📂 Bot masih kosong.')
        }

        const max = 50000

        if (structure.length > max) {
            structure =
                structure.slice(0, max) +
                '\n\n... struktur terlalu panjang'
        }

        const escapeHTML = str =>
            String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')

        const safeStructure = escapeHTML(structure)

        const htmlPayload = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<style>
*{
    box-sizing:border-box;
    margin:0;
    padding:0;
}

html,body{
    width:100%;
    min-height:100%;
}

body{
    padding:6px;
    margin:0;
    background:transparent;
    color:#fff;
    font:11px Arial,sans-serif;
}

/* CARD */

.card{
    position:relative;
    width:100%;
    max-width:400px;
    margin:auto;
    padding:20px 10px 10px;

    border:1px solid #542b47;
    border-radius:16px;

    background:
        linear-gradient(
            145deg,
            #1b0b18,
            #0d080d
        );

    box-shadow:
        0 0 20px rgba(255,70,160,.16),
        inset 0 0 18px rgba(255,70,160,.035);
}

/* GLOW */

.glow{
    position:absolute;
    width:130px;
    height:130px;
    top:-75px;
    left:50%;

    transform:translateX(-50%);
    border-radius:50%;

    background:#ff3f9d;
    filter:blur(50px);
    opacity:.2;

    pointer-events:none;

    animation:glow 4s ease-in-out infinite alternate;
}

@keyframes glow{
    0%{
        opacity:.1;
        transform:translateX(-65%) scale(.8);
    }

    100%{
        opacity:.28;
        transform:translateX(-35%) scale(1.1);
    }
}

/* HEADER */

.header{
    position:relative;
    z-index:3;
    text-align:center;
    padding-bottom:7px;
}

.flower{
    font-size:27px;
    line-height:1;
    margin-bottom:5px;

    filter:drop-shadow(0 0 9px #ff4fa3);

    animation:bloom 3s ease-in-out infinite;
}

@keyframes bloom{
    0%,100%{
        transform:scale(1) rotate(-3deg);
    }

    50%{
        transform:scale(1.07) rotate(3deg);
    }
}

.title{
    font-size:17px;
    font-weight:800;
    color:#fff;

    text-shadow:
        0 0 12px rgba(255,90,170,.4);
}

.sub{
    margin-top:3px;
    color:#947d90;
    font-size:6px;
    letter-spacing:2px;
}

/* TOOLBAR */

.toolbar{
    position:relative;
    z-index:10;

    display:flex;
    gap:5px;

    width:100%;
    margin:5px 0 7px;
}

button{
    flex:1;
    min-width:0;

    padding:7px 3px;

    border:1px solid #713452;
    border-radius:8px;

    background:#1b0c18;
    color:#ff9bc9;

    font-size:8px;
    font-weight:800;

    box-shadow:
        0 0 10px rgba(255,70,160,.12);

    -webkit-tap-highlight-color:transparent;
}

button:active{
    transform:scale(.96);
    background:#291021;
}

/* FILE VIEWER */

.viewer{
    position:relative;
    z-index:5;

    width:100%;

    /*
     * Tinggi kecil.
     * Isi tetap bisa digeser sampai paling bawah.
     */
    height:260px;
    max-height:260px;

    overflow-x:auto;
    overflow-y:auto;

    -webkit-overflow-scrolling:touch;
    overscroll-behavior:contain;
    touch-action:pan-x pan-y;

    scrollbar-width:thin;

    border:1px solid #321b2d;
    border-radius:11px;

    padding:10px;

    background:rgba(4,3,6,.8);

    box-shadow:
        inset 0 0 18px rgba(255,60,160,.05),
        0 0 12px rgba(255,60,160,.06);
}

/* TREE */

pre{
    display:block;

    width:max-content;
    min-width:100%;

    margin:0;

    color:#eabbd4;

    font-family:monospace;

    font-size:8px;
    line-height:1.5;

    white-space:pre;

    text-shadow:
        0 0 4px rgba(255,90,180,.12);

    user-select:text;
    -webkit-user-select:text;
}

/* PARTICLES */

.p{
    position:absolute;
    bottom:-10px;

    color:#ff91c4;

    font-size:9px;

    opacity:0;

    pointer-events:none;

    filter:drop-shadow(0 0 5px #ff4fa3);

    animation:float linear infinite;
}

.p1{
    left:8%;
    animation-duration:5s;
}

.p2{
    left:22%;
    animation-duration:6s;
    animation-delay:1s;
}

.p3{
    left:37%;
    animation-duration:5.5s;
    animation-delay:2s;
}

.p4{
    left:55%;
    animation-duration:7s;
    animation-delay:.5s;
}

.p5{
    left:70%;
    animation-duration:5s;
    animation-delay:2.5s;
}

.p6{
    left:84%;
    animation-duration:6.5s;
    animation-delay:1.5s;
}

@keyframes float{
    0%{
        transform:
            translateY(0)
            scale(.5)
            rotate(0);
        opacity:0;
    }

    15%{
        opacity:.7;
    }

    60%{
        opacity:.4;
    }

    100%{
        transform:
            translateY(-180px)
            translateX(18px)
            scale(1)
            rotate(180deg);
        opacity:0;
    }
}

/* SAKURA */

.sakura{
    position:absolute;

    color:#ff91c4;

    filter:drop-shadow(0 0 5px #ff4fa3);

    pointer-events:none;

    animation:sakura 3s ease-in-out infinite;
}

.s1{
    left:9%;
    bottom:12px;
}

.s2{
    left:27%;
    bottom:8px;
    font-size:8px;
    animation-delay:.7s;
}

.s3{
    right:19%;
    bottom:12px;
    font-size:13px;
    animation-delay:1.2s;
}

.s4{
    right:8%;
    bottom:8px;
    font-size:8px;
    animation-delay:1.8s;
}

@keyframes sakura{
    0%,100%{
        transform:
            translateY(0)
            rotate(0);
        opacity:1;
    }

    50%{
        transform:
            translateY(-4px)
            rotate(12deg);
        opacity:.6;
    }
}

/* WAVE */

.wave{
    position:absolute;

    left:-15%;
    bottom:5px;

    width:130%;
    height:25px;

    border-top:
        1px solid
        rgba(255,105,175,.2);

    border-radius:50%;

    box-shadow:
        0 -3px 10px
        rgba(255,70,160,.07);

    animation:
        wave 4s ease-in-out infinite alternate;

    pointer-events:none;
}

@keyframes wave{
    0%{
        transform:
            translateX(-10px)
            rotate(-3deg);
    }

    100%{
        transform:
            translateX(10px)
            rotate(3deg);
    }
}

</style>
</head>

<body>

<div class="card">

    <div class="glow"></div>

    <i class="p p1">✦</i>
    <i class="p p2">•</i>
    <i class="p p3">✿</i>
    <i class="p p4">•</i>
    <i class="p p5">✦</i>
    <i class="p p6">•</i>

    <div class="header">

        <div class="flower">
            🌸
        </div>

        <div class="title">
            BOT STRUCTURE
        </div>

        <div class="sub">
            SAKURA-MD FILE SYSTEM
        </div>

    </div>

    <div class="toolbar">

        <button onclick="goTop()">
            ▲ ATAS
        </button>

        <button onclick="goDown()">
            ▼ BAWAH
        </button>

        <button onclick="goEnd()">
            ⇣ AKHIR
        </button>

    </div>

    <div
        class="viewer"
        id="viewer"
    >

        <pre id="tree">${safeStructure}</pre>

    </div>

    <div class="wave"></div>

    <div class="sakura s1">✿</div>
    <div class="sakura s2">❀</div>
    <div class="sakura s3">✿</div>
    <div class="sakura s4">❀</div>

</div>

<script>

const viewer =
    document.getElementById('viewer');

function goTop(){

    viewer.scrollTo({
        top:0,
        behavior:'smooth'
    });

}

function goDown(){

    viewer.scrollBy({
        top:220,
        behavior:'smooth'
    });

}

function goEnd(){

    viewer.scrollTo({
        top:viewer.scrollHeight,
        behavior:'smooth'
    });

}

</script>

</body>
</html>`

        const encoded = Buffer
            .from(
                JSON.stringify({
                    response_id:
                        `sakura-ls-${Date.now()}`,

                    sections: [
                        {
                            view_model: {
                                primitive: {
                                    __typename:
                                        'GenAIaeacdsnwHtmlPrimitive',

                                    payload:
                                        htmlPayload,

                                    trusted_sources: [
                                        'sakura-md.dev'
                                    ]
                                },

                                __typename:
                                    'GenAISingleLayoutViewModel'
                            }
                        }
                    ]
                })
            )
            .toString('base64')

        await conn.relayMessage(
            m.chat,
            {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,

                    botMetadata: {
                        messageDisclaimerText: "",

                        botResponseId:
                            `sakura-ls-${Date.now()}`,

                        verificationMetadata: {
                            proofs: [
                                {
                                    version: 1,

                                    useCase: 1,

                                    signature:
                                        "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YeN55YRyad2+ZA==",

                                    certificateChain: [
                                        "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg",

                                        "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZLXC4k1gGN9swE0LtzYsUdT5u9ri/hS3W/SM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYbNBkuLoZnQAq4j8yRekrQ=="
                                    ]
                                }
                            ]
                        }
                    }
                },

                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,

                            submessages: [
                                {
                                    messageType: 2,
                                    messageText: 'Sakura-MD'
                                }
                            ],

                            unifiedResponse: {
                                data: encoded
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
            {}
        )

    } catch (e) {

        console.error(
            '[ls]',
            e
        )

        await sendInapp(conn, m, `❌ Gagal membaca struktur bot:\n${e.message}`)
    }
}

handler.command = ['ls']
handler.desc = 'Menampilkan struktur folder bot'
handler.owner = true

export default handler