/* ============================================
   LICS Dashboard — Learning Path Logic
   ============================================ */

import { requireAuth, updateHeaderUser, isAdmin } from './auth.js';

/**
 * Link label map — each platform key resolves to a user-facing label.
 */
const LINK_LABELS = {
    'tryhackme':    'Acessar sala',
    'htb-academy':  'Acessar plataforma',
    'hackthebox':   'Acessar sala',
    'letsdefend':   'Acessar plataforma',
    'github':       'Acessar repo',
    'podcast':      'Ouvir podcast',
    'docs':         'Ler doc',
    'web':          'Acessar material',
    'owasp':        'Acessar material',
    'standard':     'Acessar material',
    'offsec':       'Acessar material',
    'portswigger':  'Acessar material',
    'mitre':        'Acessar material',
    'ctf-platform': 'Acessar plataforma',
};

const LEARNING_PATH_DATA = [
    {
        id: 1,
        title: "Contexto de cybersec",
        objective: "Este módulo te mostra algumas das carreiras possíveis em cibersegurança.",
        tasks: [
            { name: "Offensive Security Intro [TryHackMe]", link: "https://tryhackme.com/room/offensivesecurityintro", platform: "tryhackme" },
            { name: "Defensive Security Intro [TryHackMe]", link: "https://tryhackme.com/room/defensivesecurityintro", platform: "tryhackme" },
            { name: "Careers in Cyber [TryHackMe]", link: "https://tryhackme.com/room/careersincyber", platform: "tryhackme" },
            { name: "Intro to Research [TryHackMe]", link: "https://tryhackme.com/room/introtoresearch", platform: "tryhackme" },
            { name: "Introduction to Information Security [HTB Academy]", link: "https://academy.hackthebox.com/", platform: "htb-academy" }
        ]
    },
    {
        id: 2,
        title: "O Alicerce: Redes & Sistemas Operacionais",
        objective: "Fundamento obrigatório para qualquer operação da LICS. Sem entender redes e sistemas operacionais, nenhum ataque ou defesa faz sentido. Dominar isso é o que separa script kiddies de operadores reais.",
        tasks: [
            { name: "Linux Fundamentals [HTB Academy]", link: "https://academy.hackthebox.com/", platform: "htb-academy" },
            { name: "Windows Fundamentals [HTB Academy]", link: "https://academy.hackthebox.com/", platform: "htb-academy" },
            { name: "Introduction to Networking [HTB Academy]", link: "https://academy.hackthebox.com/", platform: "htb-academy" },
            { name: "What is Networking? [TryHackMe]", link: "https://tryhackme.com/room/whatisnetworking", platform: "tryhackme" },
            { name: "DNS in Detail [TryHackMe]", link: "https://tryhackme.com/room/dnsindetail", platform: "tryhackme" },
            { name: "HTTP in Detail [TryHackMe]", link: "https://tryhackme.com/room/httpindetail", platform: "tryhackme" },
            { name: "How Websites Work [TryHackMe]", link: "https://tryhackme.com/room/howwebsiteswork", platform: "tryhackme" },
            { name: "Linux Fundamentals [TryHackMe]", link: "https://tryhackme.com/room/linuxfundamentalspart1", platform: "tryhackme" },
            { name: "Windows Fundamentals [TryHackMe]", link: "https://tryhackme.com/room/windowsfundamentals1xbx", platform: "tryhackme" }
        ]
    },
    {
        id: 3,
        title: "Reconnaissance & OSINT",
        objective: "Recon é a fase que define o sucesso de uma operação. Aprenda a coletar inteligência em fontes abertas.",
        tasks: [
            { name: "Active Recon [TryHackMe]", link: "https://tryhackme.com/room/activerecon", platform: "tryhackme" },
            { name: "Passive Recon [TryHackMe]", link: "https://tryhackme.com/room/passiverecon", platform: "tryhackme" },
            { name: "Searchlight OSINT [TryHackMe]", link: "https://tryhackme.com/room/searchlightosint", platform: "tryhackme" },
            { name: "Sakura [TryHackMe]", link: "https://tryhackme.com/room/sakura", platform: "tryhackme" },
            { name: "Google Dorking [TryHackMe]", link: "https://tryhackme.com/room/googledorking", platform: "tryhackme" },
            { name: "Shodan.io [TryHackMe]", link: "https://tryhackme.com/room/shodan", platform: "tryhackme" },
            { name: "OhSINT [TryHackMe]", link: "https://tryhackme.com/room/ohsint", platform: "tryhackme" },
            { name: "Threat Intelligence 101 [Recorded Future]", link: "https://www.recordedfuture.com/threat-intelligence-101/intelligence-sources-collection/information-gathering", platform: "web" },
            { name: "PTES Intelligence Gathering [Standard]", link: "http://www.pentest-standard.org/index.php/Intelligence_Gathering", platform: "standard" },
            { name: "OSINT Brazuca [GitHub]", link: "https://github.com/osintbrazuca/osint-brazuca", platform: "github" },
            { name: "OSINT Framework [Web]", link: "https://osintframework.com/", platform: "web" },
            { name: "MITRE ATT&CK Recon [Web]", link: "https://attack.mitre.org/tactics/TA0043/", platform: "mitre" }
        ]
    },
    {
        id: 4,
        title: "Scripting & Automação",
        objective: "Python para exploits e parsing, Bash para automação em Linux, são exemplos de linguagens que usamos no dia a dia dos projetos e CTFs da liga.",
        tasks: [
            { name: "Python Basics [TryHackMe]", link: "https://tryhackme.com/room/pythonbasics", platform: "tryhackme" },
            { name: "Intro to PoC Scripting [TryHackMe]", link: "https://tryhackme.com/room/intropocscripting", platform: "tryhackme" },
            { name: "Bash Scripting [TryHackMe]", link: "https://tryhackme.com/room/bashscripting", platform: "tryhackme" }
        ]
    },
    {
        id: 5,
        title: "Threat Modeling: Pensando como o Atacante",
        objective: "Na LICS, pensamos como adversários. Este módulo te ensina a modelar ameaças, identificar vetores de ataque e acompanhar o cenário global de cibersegurança através de fontes confiáveis.",
        tasks: [
            { name: "OWASP Threat Modeling [OWASP]", link: "https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html", platform: "owasp" },
            { name: "PTES Threat Modeling [Standard]", link: "http://www-pentest-standard.org/index.php/Threat_Modeling", platform: "standard" },
            { name: "Darknet Diaries [Podcast]", link: "https://darknetdiaries.com", platform: "podcast" },
            { name: "Malicious Life [Podcast]", link: "https://malicious.life", platform: "podcast" }
        ]
    },
    {
        id: 6,
        title: "Tooling: Arsenal do Pentester",
        objective: "Conheça as ferramentas que usamos nas operações da LICS. De scanners de rede a brute-forcers e sniffers, domine o arsenal antes de ir para o campo.",
        tasks: [
            { name: "Hacker Methodology [TryHackMe]", link: "https://tryhackme.com/room/hackermethodology", platform: "tryhackme" },
            { name: "Introduction to Penetration Testing [HTB Academy]", link: "https://academy.hackthebox.com/", platform: "htb-academy" },
            { name: "Nmap — Parte 1 [TryHackMe]", link: "https://tryhackme.com/room/nmap01", platform: "tryhackme" },
            { name: "Nmap — Parte 2 [TryHackMe]", link: "https://tryhackme.com/room/furthernmap", platform: "tryhackme" },
            { name: "Metasploit Intro [TryHackMe]", link: "https://tryhackme.com/room/metasploitintro", platform: "tryhackme" },
            { name: "Metasploit Unleashed [OffSec]", link: "https://www.offsec.com/metasploit-unleashed/", platform: "offsec" },
            { name: "Hydra [TryHackMe]", link: "https://tryhackme.com/room/hydra", platform: "tryhackme" },
            { name: "TShark [TryHackMe]", link: "https://tryhackme.com/room/tshark", platform: "tryhackme" },
            { name: "Ffuf [TryHackMe]", link: "https://tryhackme.com/room/ffuf", platform: "tryhackme" }
        ]
    },
    {
        id: 7,
        title: "Web Hacking & OWASP Top 10",
        objective: "A maioria dos CTFs que participamos tem challenges web. Este módulo cobre o OWASP Top 10 e te prepara para resolver desafios de XSS, SQLi, SSRF e mais.",
        tasks: [
            { name: "OWASP Top 10 [OWASP]", link: "https://owasp.org/www-project-top-ten/", platform: "owasp" },
            { name: "Introduction to Web Applications [HTB Academy]", link: "https://academy.hackthebox.com/", platform: "htb-academy" },
            { name: "Web Security Academy [PortSwigger]", link: "https://portswigger.net/web-security", platform: "portswigger" },
            { name: "Prática XSS [TryHackMe]", link: "https://tryhackme.com/room/axss", platform: "tryhackme" },
            { name: "SQL Injection Lab [TryHackMe]", link: "https://tryhackme.com/room/sqlilab", platform: "tryhackme" }
        ]
    },
    {
        id: 8,
        title: "Criptografia & Hash Cracking",
        objective: "Criptografia aparece em quase todo CTF. Logo, você precisa entender hashing, encoding e técnicas de cracking para resolver challenges de crypto e forensics.",
        tasks: [
            { name: "Cryptography for Dummies [TryHackMe]", link: "https://tryhackme.com/room/cryptographyfordummies", platform: "tryhackme" },
            { name: "Crack the Hash [TryHackMe]", link: "https://tryhackme.com/room/crackthehash", platform: "tryhackme" },
            { name: "Crack the Hash Level 2 [TryHackMe]", link: "https://tryhackme.com/room/crackthehashlevel2", platform: "tryhackme" },
            { name: "Agent Sudo [TryHackMe]", link: "https://tryhackme.com/room/agentsudoctf", platform: "tryhackme" },
            { name: "Brute It [TryHackMe]", link: "https://tryhackme.com/room/bruteit", platform: "tryhackme" }
        ]
    },
    {
        id: 9,
        title: "Pós-Exploração & Active Directory",
        objective: "Conseguiu o shell inicial? Aqui, o jogo continua. Aprenda movimentação lateral, escalação de privilégios e as técnicas de domínio de Active Directory que aparecem em CTFs e labs internos.",
        tasks: [
            { name: "PrivEsc no Windows [TryHackMe]", link: "https://tryhackme.com/room/windows10privesc", platform: "tryhackme" },
            { name: "PrivEsc no Linux [TryHackMe]", link: "https://tryhackme.com/room/linprivesc", platform: "tryhackme" },
            { name: "Active Directory Basics [TryHackMe]", link: "https://tryhackme.com/room/winadbasics", platform: "tryhackme" },
            { name: "Guia BloodHound [Medium]", link: "https://m4lwhere.medium.com/the-ultimate-guide-for-bloodhound-community-edition-bhce-80b574595acf", platform: "web" },
            { name: "Metodologia AD [HackTricks]", link: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology", platform: "web" },
            { name: "Abuse de Kerberos [MITRE]", link: "https://attack.mitre.org/techniques/T1558/003/", platform: "mitre" },
            { name: "Credential Dumping [MITRE]", link: "https://attack.mitre.org/techniques/T1003/", platform: "mitre" }
        ]
    },
    {
        id: 10,
        title: "Engenharia Social & O Fator Humano",
        objective: "Nem todo ataque é técnico. Então, precisamos estudar o fator humano, de campanhas de phishing a ataques físicos. Entenda como esses vetores são usados no mundo real.",
        tasks: [
            { name: "Ameaças de Social Engineering [Cloudflare]", link: "https://www.cloudflare.com/learning/security/threats/social-engineering-attack/", platform: "web" },
            { name: "Phishing e Manipulação [Akamai]", link: "https://www.akamai.com/glossary/what-is-phishing", platform: "web" },
            { name: "Técnicas de Phishing [MITRE]", link: "https://attack.mitre.org/techniques/T1566/", platform: "mitre" },
            { name: "Social Engineering Físico [Integrity360]", link: "https://insights.integrity360.com/what-is-physical-social-engineering-and-why-is-it-important", platform: "web" },
            { name: "Ferramenta: Evilginx2 [GitHub]", link: "https://github.com/kgretzky/evilginx2", platform: "github" }
        ]
    },
    {
        id: 11,
        title: "Mobile Hacking: Ecossistema Android",
        objective: "Desafios mobile estão cada vez mais presentes nos CTFs. Aqui, dissecamos APKs, interceptamos tráfego e exploramos armazenamento inseguro para resolver challenges de mobile security.",
        tasks: [
            { name: "OWASP Mobile Security [OWASP]", link: "https://owasp.org/www-project-mobile-app-security/", platform: "owasp" },
            { name: "Guia de Testes Mobile [OWASP]", link: "https://mas.owasp.org/MASTG/", platform: "owasp" },
            { name: "Intro ao Mobile Pentesting [HTB]", link: "https://www.hackthebox.com/blog/intro-to-mobile-pentesting", platform: "web" },
            { name: "Crackmes Android [OWASP]", link: "https://mas.owasp.org/crackmes/", platform: "owasp" },
            { name: "Android Hacking 101 [TryHackMe]", link: "https://tryhackme.com/room/androidhacking101", platform: "tryhackme" }
        ]
    },
    {
        id: 12,
        title: "Reverse Engineering",
        objective: "Engenharia reversa é o que separa quem usa ferramentas de quem entende o que está por baixo. Na LICS, usamos REV para analisar binários, crackmes e challenges de CTF.",
        tasks: [
            { name: "Win64 Assembly [TryHackMe]", link: "https://tryhackme.com/room/win64assembly", platform: "tryhackme" },
            { name: "Reverse Engineering Files [TryHackMe]", link: "https://tryhackme.com/room/reverselfiles", platform: "tryhackme" },
            { name: "JVM Reverse Engineering [TryHackMe]", link: "https://tryhackme.com/room/jvmreverseengineering", platform: "tryhackme" },
            { name: "Aster [TryHackMe]", link: "https://tryhackme.com/room/aster", platform: "tryhackme" },
            { name: "Classic Passwd [TryHackMe]", link: "https://tryhackme.com/room/classicpasswd", platform: "tryhackme" }
        ]
    },
    {
        id: 13,
        title: "Malware Analysis",
        objective: "Entender como malware funciona é essencial para ofensivo e defensivo. Na LICS, dissecamos amostras reais, analisamos tráfego C2 e investigamos campanhas de ameaças.",
        tasks: [
            { name: "History of Malware [TryHackMe]", link: "https://tryhackme.com/room/historyofmalware", platform: "tryhackme" },
            { name: "MAL: Introductory [TryHackMe]", link: "https://tryhackme.com/room/malmalintroductory", platform: "tryhackme" },
            { name: "Basic Malware RE [TryHackMe]", link: "https://tryhackme.com/room/basicmalwarere", platform: "tryhackme" },
            { name: "Malware Researching [TryHackMe]", link: "https://tryhackme.com/room/malresearching", platform: "tryhackme" },
            { name: "Malware Analysis [TryHackMe]", link: "https://tryhackme.com/room/mma", platform: "tryhackme" },
            { name: "C2 Carnage [TryHackMe]", link: "https://tryhackme.com/room/c2carnage", platform: "tryhackme" },
            { name: "Dunkle Materie [TryHackMe]", link: "https://tryhackme.com/room/dunklematerieptxc9", platform: "tryhackme" }
        ]
    },
    {
        id: 14,
        title: "Blue Team & SOC",
        objective: "A LICS não é só ofensivo. Entender defesa, análise de logs e resposta a incidentes te torna um profissional mais completo e te prepara para challenges de forensics e DFIR.",
        tasks: [
            { name: "SOC Fundamentals [LetsDefend]", link: "https://letsdefend.io/", platform: "letsdefend" },
            { name: "SIEM 101 [LetsDefend]", link: "https://letsdefend.io/", platform: "letsdefend" },
            { name: "Phishing Email Analysis [LetsDefend]", link: "https://letsdefend.io/", platform: "letsdefend" }
        ]
    },
    {
        id: 15,
        title: "CTF Playground",
        objective: "Hora de aplicar tudo. Estes são os ambientes e máquinas que os membros da LICS usam para treinar antes de competições. Boot2root, wargames e challenges para forjar suas habilidades.",
        tasks: [
            { name: "Wargame Bandit [OverTheWire]", link: "https://overthewire.org/wargames/bandit/", platform: "ctf-platform" },
            { name: "Desafios PicoCTF [PicoCTF]", link: "https://picoctf.org/", platform: "ctf-platform" },
            { name: "Laboratório Metasploitable 2 [Rapid7]", link: "https://docs.rapid7.com/metasploit/metasploitable-2/", platform: "docs" },
            { name: "Máquinas VulnHub [VulnHub]", link: "https://www.vulnhub.com", platform: "ctf-platform" },
            { name: "Gaming Server [TryHackMe]", link: "https://tryhackme.com/room/gamingserver", platform: "tryhackme" },
            { name: "OverlayFS [TryHackMe]", link: "https://tryhackme.com/room/overlayfs", platform: "tryhackme" },
            { name: "Psycho Break [TryHackMe]", link: "https://tryhackme.com/room/psychobreak", platform: "tryhackme" },
            { name: "Cowboy Hacker [TryHackMe]", link: "https://tryhackme.com/room/cowboyhacker", platform: "tryhackme" },
            { name: "CTF [TryHackMe]", link: "https://tryhackme.com/room/ctf", platform: "tryhackme" },
            { name: "RootMe [TryHackMe]", link: "https://tryhackme.com/room/rrootme", platform: "tryhackme" },
            { name: "AttackerKB [TryHackMe]", link: "https://tryhackme.com/room/attackerkb", platform: "tryhackme" },
            { name: "Pickle Rick [TryHackMe]", link: "https://tryhackme.com/room/picklerick", platform: "tryhackme" },
            { name: "BSides GT Library [TryHackMe]", link: "https://tryhackme.com/room/bsidesgtlibrary", platform: "tryhackme" },
            { name: "c4ptur3-th3-fl4g [TryHackMe]", link: "https://tryhackme.com/room/c4ptur3th3fl4g", platform: "tryhackme" },
            { name: "BSides GT Thompson [TryHackMe]", link: "https://tryhackme.com/room/bsidesgtthompson", platform: "tryhackme" },
            { name: "Easy CTF [TryHackMe]", link: "https://tryhackme.com/room/easyctf", platform: "tryhackme" },
            { name: "Lazy Admin [TryHackMe]", link: "https://tryhackme.com/room/lazyadmin", platform: "tryhackme" },
            { name: "BSides GT AnonForce [TryHackMe]", link: "https://tryhackme.com/room/bsidesgtanonforce", platform: "tryhackme" },
            { name: "Ignite [TryHackMe]", link: "https://tryhackme.com/room/ignite", platform: "tryhackme" },
            { name: "Wgel CTF [TryHackMe]", link: "https://tryhackme.com/room/wgelctf", platform: "tryhackme" },
            { name: "Kenobi [TryHackMe]", link: "https://tryhackme.com/room/kenobi", platform: "tryhackme" },
            { name: "BSides GT Dav [TryHackMe]", link: "https://tryhackme.com/room/bsidesgtdav", platform: "tryhackme" },
            { name: "Ninja Skills [TryHackMe]", link: "https://tryhackme.com/room/ninjaskills", platform: "tryhackme" },
            { name: "Ice [TryHackMe]", link: "https://tryhackme.com/room/ice", platform: "tryhackme" },
            { name: "Lian Yu [TryHackMe]", link: "https://tryhackme.com/room/lianyu", platform: "tryhackme" },
            { name: "The Cod Caper [TryHackMe]", link: "https://tryhackme.com/room/thecodcaper", platform: "tryhackme" }
        ]
    }
];

const STORAGE_KEY = 'lics_lp_progress';

/**
 * Initialize the Learning Path page
 */
async function initLP() {
    const user = await requireAuth();
    if (!user) return;

    updateHeaderUser(user);

    // Show admin link if admin
    if (isAdmin()) {
        const navAdmin = document.getElementById('nav-admin');
        if (navAdmin) navAdmin.style.display = 'inline-flex';
    }

    renderModules();
    buildSidebarLinks();
    initScrollTracking();
    setupCheckboxListeners();
}

/**
 * Render Modules and Tasks
 */
function renderModules() {
    const container = document.getElementById('modules-container');
    if (!container) return;

    const progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    container.innerHTML = LEARNING_PATH_DATA.map(mod => `
        <div class="module-card" id="module-${mod.id}">
            <div class="module-header">
                <h2 class="module-title">${mod.title}</h2>
                <div class="module-objective">${mod.objective}</div>
            </div>
            <div class="module-content">
                <ul class="task-list">
                    ${mod.tasks.map((task, idx) => {
                        const linkText = LINK_LABELS[task.platform] || 'Acessar material';
                        return `
                            <li class="task-item">
                                <div class="task-info">
                                    <span class="task-name">${task.name}</span>
                                    ${task.link ? `<a href="${task.link}" target="_blank" class="task-link">${linkText}</a>` : ''}
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
                ${mod.externalLink ? `
                    <div style="margin-top: var(--space-md); text-align: right;">
                        <a href="${mod.externalLink}" target="_blank" class="btn btn-sm">Acessar Plataforma Principal ↗</a>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}


/**
 * Handle checkbox persistence (REMOVED)
 */
function setupCheckboxListeners() {
    // Logic removed as per user request to disable marking
}

/**
 * Dynamically populate sidebar links from LEARNING_PATH_DATA.
 */
function buildSidebarLinks() {
    const sidebarContainer = document.getElementById('sidebar-modules');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = LEARNING_PATH_DATA.map(mod => `
        <a href="#module-${mod.id}" class="lp-sidebar-link" data-section="module-${mod.id}">
            <span class="lp-sidebar-num">${String(mod.id).padStart(2, '0')}</span> ${mod.title}
        </a>
    `).join('');

    // Smooth-scroll click handlers
    document.querySelectorAll('.lp-sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Highlight the active sidebar link based on scroll position.
 */
function initScrollTracking() {
    const sections = document.querySelectorAll('.module-card[id]');
    const links = document.querySelectorAll('.lp-sidebar-link');
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                links.forEach(link => {
                    link.classList.toggle('active', link.dataset.section === id);
                });
            }
        });
    }, {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initLP);
