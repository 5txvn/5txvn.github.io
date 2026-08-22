const links = {
    github: 'https://github.com/5txvn',
    linkedin: 'https://www.linkedin.com/in/steven-livingston-b599482b5/',
    resume: 'resume.pdf'
};

const projects = {
    spellingtree: { title: 'SpellingTree', url: 'https://spellingtree.org', icon: 'translate.png' },
    carrytheone: { title: 'CarryTheOne', url: 'https://5txvn.github.io/carrytheone', icon: 'one.png' },
    dxdy: { title: 'dxdy', url: 'https://dxdy-m2c7.onrender.com', icon: 'calculator.png' },
    slink: { title: 'Slink', url: 'https://sem-link.org', icon: 'slink.png' },
    knowurschist: { title: 'KnowUrSchist', url: 'https://5txvn.github.io/knowurschist/biology', icon: 'petri-dish.png' }
};

const notepadIds = ['about', 'contact', 'spellingtree', 'carrytheone', 'dxdy', 'slink', 'knowurschist'];

const mdToHtml = md => {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = s => esc(s)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
            if(href.startsWith('mailto:')) return `<a href="${href}">${text}</a>`;
            return `<a href="${href}" class="project-open-link underline cursor-pointer" target="_blank" rel="noopener">${text}</a>`;
        })
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');

    const lines = md.replace(/\r\n/g, '\n').split('\n');
    let html = '', list = false;
    const closeList = () => { if(list) { html += '</ul>'; list = false; } };

    for(const line of lines) {
        const t = line.trim();
        if(!t) { closeList(); continue; }
        if(t.startsWith('- ')) {
            if(!list) { html += '<ul>'; list = true; }
            html += '<li>' + inline(t.slice(2)) + '</li>';
            continue;
        }
        closeList();
        if(t.startsWith('### ')) html += '<h3>' + inline(t.slice(4)) + '</h3>';
        else if(t.startsWith('## ')) html += '<h2>' + inline(t.slice(3)) + '</h2>';
        else if(t.startsWith('# ')) html += '<h1>' + inline(t.slice(2)) + '</h1>';
        else html += '<p>' + inline(t) + '</p>';
    }
    closeList();
    return html;
};

const loadNotepad = async id => {
    const res = await fetch('notepad/' + id + '.md');
    return mdToHtml(await res.text());
};
