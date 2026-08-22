$(function() {
    const isMobile = () => window.innerWidth < 768;
    const $area = $('#windows-area');
    const taskbarH = 56;
    const bgLight = ['images/bg-light-1.png', 'images/bg-light-2.png'];
    const bgDark = ['images/bg-dark-1.png', 'images/bg-dark-2.png'];
    const wallpaperOptions = ['bg.png', 'bg-test.png', 'wallpaper.png', 'wallpaper-alt.jpg'];
    const defaultIconPos = {
        about: [16, 20], contact: [140, 20], resume: [264, 20], github: [388, 20], linkedin: [512, 20],
        spellingtree: [16, 148], slink: [140, 148], dxdy: [264, 148], carrytheone: [388, 148], knowurschist: [512, 148],
        settings: [16, 276], edge: [140, 276], theme: [264, 276]
    };

    let zIndex = 100;
    let aboutClosedOnce = false;
    let bgMusic = null;
    let bgLightIndex = 0;
    let bgDarkIndex = 0;
    let bgTimer = null;
    let bgReady = false;
    let errorPlayed = false;

    const playWinError = () => {
        if(errorPlayed) return;
        errorPlayed = true;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if(ctx.state === 'suspended') ctx.resume();
            const notes = [392, 311, 247];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                const t = ctx.currentTime + i * 0.16;
                gain.gain.setValueAtTime(0.07, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.2);
            });
        } catch(e) {}
    };

    const startMusic = () => {
        try {
            bgMusic = new Audio('bg-music.mp3');
            bgMusic.loop = true;
            bgMusic.volume = 0.7;
            bgMusic.play().catch(() => {});
            $('#volume-slider').val(70);
        } catch(e) {}
    };

    const bringToFront = $win => $win.css('zIndex', zIndex++);

    const bindProjectLink = $win => {
        $win.find('.notepad-editor a').off('click').on('click', e => {
            const u = $(e.currentTarget).attr('href');
            if(!u || u.startsWith('mailto:')) return;
            e.preventDefault();
            window.open(u, '_blank');
        });
    };

    //wallpaper
    const allBg = bgLight.concat(bgDark);
    let bgLoaded = 0;
    allBg.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            bgLoaded++;
            if(bgLoaded >= allBg.length) bgReady = true;
        };
        img.src = src;
    });

    const tickWallpaper = () => {
        const dark = $('body').hasClass('dark-mode');
        const arr = dark ? bgDark : bgLight;
        if(!arr.length) return;
        const url = arr[dark ? bgDarkIndex : bgLightIndex];
        const img = new Image();
        img.onload = () => $('#desktop-wallpaper').css('background-image', `url('${url}')`);
        img.src = url;
        if(dark) bgDarkIndex = (bgDarkIndex + 1) % arr.length;
        else bgLightIndex = (bgLightIndex + 1) % arr.length;
    };

    const startBg = () => {
        const go = () => {
            tickWallpaper();
            clearInterval(bgTimer);
            bgTimer = setInterval(tickWallpaper, 500);
        };
        if(bgReady) return go();
        const wait = setInterval(() => {
            if(bgReady) { clearInterval(wait); go(); }
        }, 50);
    };

    const firstBg = new Image();
    firstBg.onload = () => $('#wallpaper-fallback').addClass('hidden');
    firstBg.src = bgLight[0];

    const updateThemeBtn = () => {
        const dark = $('body').hasClass('dark-mode');
        $('#theme-toggle-label').text(dark ? 'Light mode' : 'Dark mode');
        $('#theme-toggle-img').attr('src', dark ? 'images/icons/sun.png' : 'images/icons/moon.png');
    };

    const savedTheme = localStorage.getItem('portfolio-theme');
    if(savedTheme === 'dark') {
        $('body').addClass('dark-mode');
    }
    else if(!savedTheme) try { localStorage.setItem('portfolio-theme', 'light'); } catch(e) {}
    updateThemeBtn();
    if(!$('#desktop').hasClass('hidden') && !isMobile()) startBg();

    const setTheme = dark => {
        $('body').toggleClass('dark-mode', dark);
        try { localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light'); } catch(e) {}
        updateThemeBtn();
        if(!$('#desktop').hasClass('hidden') && !isMobile()) startBg();
    };

    //login
    const enterDesktop = () => {
        if(isMobile()) {
            openWindow('about');
            return;
        }
        startBg();
        openWindow('about');
        openWindow('welcome');
        const cmdW = 760;
        const aboutW = Math.min(960, window.innerWidth - cmdW - 72);
        $area.find('[data-window-id="welcome"]').css({ left: 'auto', right: '24px', top: '24px', marginLeft: '', marginTop: '', width: cmdW + 'px' });
        $area.find('[data-window-id="about"]').css({ left: '24px', top: 'auto', bottom: '88px', width: aboutW + 'px', maxWidth: 'none' });
    };

    const dismissLogin = () => {
        setTheme(false);
        $('#login-screen').addClass('hidden');
        $('#desktop').removeClass('hidden');
        if(!isMobile() && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
        startMusic();
        enterDesktop();
    };

    const dismissMobileWarning = () => {
        $('#mobile-warning').addClass('hidden dismissed').removeClass('flex');
        startMusic();
        enterDesktop();
    };

    $('.mobile-warning-ok').on('click', e => {
        e.stopPropagation();
        playWinError();
        setTimeout(dismissMobileWarning, 450);
    });
    $('#mobile-warning').on('pointerdown', playWinError);

    $('#login-enter-btn').on('click', dismissLogin);
    $(document).on('keydown', e => {
        if(!$('#login-screen').hasClass('hidden') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            dismissLogin();
        }
    });

    $('#theme-toggle').on('dblclick', e => {
        e.preventDefault();
        e.stopPropagation();
        setTheme(!$('body').hasClass('dark-mode'));
    });

    //desktop icons
    let iconPositions = {};
    let mobileIconPositions = {};
    try { iconPositions = JSON.parse(localStorage.getItem('desktop-icon-positions') || '{}'); } catch(e) {}
    try {
        if(localStorage.getItem('mobile-icons-v2') !== '1') {
            localStorage.removeItem('mobile-icon-positions');
            localStorage.setItem('mobile-icons-v2', '1');
        }
        mobileIconPositions = JSON.parse(localStorage.getItem('mobile-icon-positions') || '{}');
    } catch(e) {}
    const $iconBox = $('#desktop-icons-draggable');

    const freezeMobileIcons = () => {
        if(!isMobile() || $iconBox.hasClass('icons-free')) return;
        const cr = $iconBox[0].getBoundingClientRect();
        const snaps = [];
        $('.draggable-icon').each(function() {
            const r = this.getBoundingClientRect();
            snaps.push({ el: this, left: r.left - cr.left, top: r.top - cr.top });
        });
        snaps.forEach(s => $(s.el).css({ position: 'absolute', left: s.left + 'px', top: s.top + 'px' }));
        $iconBox.addClass('icons-free');
    };

    const layoutIcons = () => {
        if(isMobile()) {
            if(bgTimer) { clearInterval(bgTimer); bgTimer = null; }
            const saved = Object.values(mobileIconPositions);
            const spread = saved.length ? Math.max(...saved.map(p => p[0])) - Math.min(...saved.map(p => p[0])) : 0;
            if(saved.length >= 3 && spread > 80) {
                $iconBox.addClass('icons-free');
                $('.draggable-icon').each(function() {
                    const id = $(this).data('icon-id');
                    const pos = mobileIconPositions[id];
                    if(pos) $(this).css({ position: 'absolute', left: pos[0] + 'px', top: pos[1] + 'px' });
                });
            } else {
                mobileIconPositions = {};
                try { localStorage.removeItem('mobile-icon-positions'); } catch(e) {}
                $iconBox.removeClass('icons-free');
                $('.draggable-icon').css({ position: '', left: '', top: '', width: '' });
            }
            return;
        }
        $iconBox.removeClass('icons-free');
        $('.draggable-icon').each(function() {
            const id = $(this).data('icon-id');
            const pos = iconPositions[id] || defaultIconPos[id] || [16, 20];
            $(this).css({ position: 'absolute', left: pos[0] + 'px', top: pos[1] + 'px', width: '' });
        });
        if(!$('#desktop').hasClass('hidden')) startBg();
    };
    layoutIcons();
    window.matchMedia('(max-width: 767px)').addEventListener('change', layoutIcons);

    let draggingIcon = false, justDragged = false, $dragIcon = null;
    let iconSx, iconSy, iconSl, iconSt;

    const pointer = e => {
        if(e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if(e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    };

    $iconBox.on('mousedown touchstart', '.draggable-icon', function(e) {
        if(e.type === 'mousedown' && e.which !== 1) return;
        if(!isMobile() && $(this).hasClass('mode-icon')) return;
        const p = pointer(e);
        const r = this.getBoundingClientRect();
        const cr = $iconBox[0].getBoundingClientRect();
        draggingIcon = false;
        $dragIcon = $(this);
        iconSx = p.x;
        iconSy = p.y;
        iconSl = r.left - cr.left;
        iconSt = r.top - cr.top;
    });

    $(document).on('mousemove touchmove', e => {
        if(!$dragIcon) return;
        const p = pointer(e);
        const dx = p.x - iconSx, dy = p.y - iconSy;
        if(!draggingIcon && (dx * dx + dy * dy > 36)) {
            draggingIcon = true;
            freezeMobileIcons();
            $dragIcon.css({ position: 'absolute' });
        }
        if(!draggingIcon) return;
        if(e.type === 'touchmove') e.preventDefault();
        const cr = $iconBox[0].getBoundingClientRect();
        const iconW = $dragIcon.outerWidth() || 96;
        $dragIcon.css({
            left: Math.max(0, Math.min(cr.width - iconW, iconSl + p.x - iconSx)) + 'px',
            top: Math.max(0, Math.min(cr.height - 70, iconSt + p.y - iconSy)) + 'px'
        });
    });

    $(document).on('mouseup touchend', e => {
        if(e.type === 'mouseup' && e.which !== 1) return;
        if(draggingIcon && $dragIcon) {
            const id = $dragIcon.data('icon-id');
            const pos = [parseInt($dragIcon.css('left'), 10), parseInt($dragIcon.css('top'), 10)];
            if(isMobile()) {
                $('.draggable-icon').each(function() {
                    mobileIconPositions[$(this).data('icon-id')] = [parseInt($(this).css('left'), 10) || 0, parseInt($(this).css('top'), 10) || 0];
                });
                try { localStorage.setItem('mobile-icon-positions', JSON.stringify(mobileIconPositions)); } catch(err) {}
            } else {
                iconPositions[id] = pos;
                try { localStorage.setItem('desktop-icon-positions', JSON.stringify(iconPositions)); } catch(err) {}
            }
            justDragged = true;
            setTimeout(() => { justDragged = false; }, 150);
        }
        $dragIcon = null;
        draggingIcon = false;
    });

    document.addEventListener('touchmove', e => {
        if(draggingIcon) e.preventDefault();
    }, { passive: false });

    const openFromIcon = win => {
        if(win === 'github') return window.open(links.github, '_blank');
        if(win === 'linkedin') return window.open(links.linkedin, '_blank');
        if(win === 'edge') return openBrowser();
        if(win === 'resume') return openWindow('resume');
        if(projects[win]) {
            openWindow(win);
            if(!isMobile()) {
                openBrowser(projects[win].url, projects[win].title);
                setTimeout(() => layoutProjectWindows(win), 0);
            }
            return;
        }
        openWindow(win);
    };

    $('.desktop-icon').on('click', function(e) {
        e.preventDefault();
        if(justDragged) return;
        if($(this).hasClass('mode-icon')) {
            if(isMobile()) setTheme(!$('body').hasClass('dark-mode'));
            else {
                $('.desktop-icon').removeClass('bg-white/25 rounded-sm');
                $(this).addClass('bg-white/25 rounded-sm');
            }
            return;
        }
        if(isMobile()) return openFromIcon($(this).data('window'));
        $('.desktop-icon').removeClass('bg-white/25 rounded-sm');
        $(this).addClass('bg-white/25 rounded-sm');
    });

    $('#desktop-icons').on('click', e => {
        if(!$(e.target).closest('.desktop-icon').length) $('.desktop-icon').removeClass('bg-white/25 rounded-sm');
    });

    const setImportant = (el, styles) => {
        for(const k in styles) el.style.setProperty(k.replace(/([A-Z])/g, '-$1').toLowerCase(), styles[k], 'important');
    };

    const layoutProjectWindows = id => {
        if(isMobile()) return;
        const $notepad = $area.find(`[data-window-id="${id}"]`);
        const $browser = $area.find('.desktop-window').filter(function() {
            const wid = $(this).attr('data-window-id');
            return wid && wid.indexOf('browser-') === 0;
        }).last();
        if(!$notepad.length || !$browser.length) return;
        const w = window.innerWidth, h = window.innerHeight - taskbarH;
        setImportant($notepad[0], { left: w * 0.01 + 'px', top: h * 0.01 + 'px', width: w * 0.32 + 'px', minHeight: h * 0.4 + 'px', height: h * 0.4 + 'px', maxWidth: 'none', maxHeight: 'none' });
        setImportant($browser[0], { left: (w - w * 0.01 - w * 0.64) + 'px', top: (h - h * 0.05 - h * 0.64) + 'px', right: 'auto', bottom: 'auto', width: w * 0.64 + 'px', minHeight: h * 0.64 + 'px', height: h * 0.64 + 'px', maxWidth: 'none', maxHeight: 'none' });
    };

    $('.desktop-icon').on('dblclick', function(e) {
        e.preventDefault();
        if(justDragged || $(this).hasClass('mode-icon') || isMobile()) return;
        $(this).removeClass('bg-white/25 rounded-sm');
        openFromIcon($(this).data('window'));
    });

    const maximizeWin = $win => {
        $win.data('prevBounds', {
            left: $win.css('left'), top: $win.css('top'), width: $win.css('width'),
            minHeight: $win.css('minHeight'), marginLeft: $win.css('marginLeft'), marginTop: $win.css('marginTop')
        });
        $win.removeClass('rounded-t-lg').addClass('maximized rounded-none');
        $win[0].style.position = 'fixed';
        $win.css({ left: '0', top: '0', right: '0', bottom: taskbarH + 'px', width: '100%', height: '', minHeight: '', marginLeft: '0', marginTop: '0' });
        $win.find('.window-titlebar').css('cursor', 'default');
        $win.find('[class*="window-resize-"]').css('pointer-events', 'none');
    };

    const restoreWin = $win => {
        $win.removeClass('maximized rounded-none').addClass('rounded-t-lg');
        const prev = $win.data('prevBounds');
        if(prev) {
            $win[0].style.position = 'absolute';
            $win.css({ left: prev.left, top: prev.top, right: '', bottom: '', width: prev.width || '', height: '', minHeight: prev.minHeight || '', marginLeft: prev.marginLeft || '', marginTop: prev.marginTop || '' });
        }
        $win.find('.window-titlebar').css('cursor', 'move');
        $win.find('[class*="window-resize-"]').css('pointer-events', '');
    };

    const wireWindow = $win => {
        $win.on('mousedown', () => bringToFront($win));

        $win.find('.window-close').on('click', () => {
            if($win.attr('data-window-id') === 'about') {
                aboutClosedOnce = true;
                $win.find('.about-hint').remove();
                const $editor = $win.find('.notepad-editor');
                if($editor.length) $win.data('notepad-default', $editor.html());
            }
            const $editor = $win.find('.notepad-editor');
            if($editor.length && $win.data('notepad-default') != null) {
                $editor.html($win.data('notepad-default'));
                bindProjectLink($win);
            }
            $win.addClass('hidden');
        });

        $win.find('.window-minimize').on('click', () => {
            $win.css({ transition: 'opacity 0.15s ease, transform 0.15s ease', opacity: '0', transform: 'scale(0.95)' });
            setTimeout(() => $win.addClass('hidden').css({ opacity: '', transform: '', transition: '' }), 150);
        });

        $win.find('.window-maximize').on('click', () => {
            $win.hasClass('maximized') ? restoreWin($win) : maximizeWin($win);
        });

        //drag
        const $bar = $win.find('.window-titlebar');
        let dragging = false, ox, oy, sl, st;
        const coords = e => e.touches && e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
        const startDrag = e => {
            if($(e.target).closest('button').length || $win.hasClass('maximized')) return;
            e.preventDefault();
            const c = coords(e), r = $win[0].getBoundingClientRect(), ar = $area[0].getBoundingClientRect();
            dragging = true;
            ox = c.x; oy = c.y;
            sl = r.left - ar.left;
            st = r.top - ar.top;
            bringToFront($win);
            $win[0].style.transition = 'none';
        };
        $bar.on('mousedown', startDrag);
        $bar.on('touchstart', startDrag, { passive: false });
        $(document).on('mousemove touchmove', e => {
            if(!dragging) return;
            if(e.type === 'touchmove') e.preventDefault();
            const c = coords(e);
            $win.css({ left: (sl + c.x - ox) + 'px', top: (st + c.y - oy) + 'px', right: '', bottom: '', marginLeft: '', marginTop: '' });
        });
        $(document).on('mouseup touchend', () => {
            if(!dragging) return;
            dragging = false;
            $win[0].style.transition = '';
        });

        //resize
        if($win.find('.window-resize-e').length && !$win.find('.window-resize-w').length) {
            $win.append('<div class="window-resize-w"></div><div class="window-resize-n"></div><div class="window-resize-nw"></div><div class="window-resize-ne"></div><div class="window-resize-sw"></div>');
        }
        const startResize = (edge, e) => {
            e.preventDefault();
            e.stopPropagation();
            const el = $win[0];
            el.style.transition = 'none';
            const area = $area[0].getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const left = r.left - area.left;
            const top = r.top - area.top;
            const width = r.width;
            const height = r.height;
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.width = width + 'px';
            el.style.height = height + 'px';
            el.style.minHeight = height + 'px';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.marginLeft = '0';
            el.style.marginTop = '0';
            el.style.maxWidth = 'none';
            el.style.maxHeight = 'none';
            const sx = e.clientX, sy = e.clientY;
            const cursors = { e: 'ew-resize', w: 'ew-resize', n: 'ns-resize', s: 'ns-resize', se: 'nwse-resize', nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };
            document.body.style.cursor = cursors[edge] || 'default';
            document.body.style.userSelect = 'none';
            $(document).on('mousemove.resize', e2 => {
                e2.preventDefault();
                const dx = e2.clientX - sx, dy = e2.clientY - sy;
                let l = left, t = top, w = width, h = height;
                if(edge === 'e' || edge === 'se' || edge === 'ne') w = Math.max(320, width + dx);
                if(edge === 's' || edge === 'se' || edge === 'sw') h = Math.max(200, height + dy);
                if(edge === 'w' || edge === 'sw' || edge === 'nw') {
                    w = Math.max(320, width - dx);
                    l = left + (width - w);
                }
                if(edge === 'n' || edge === 'ne' || edge === 'nw') {
                    h = Math.max(200, height - dy);
                    t = top + (height - h);
                }
                el.style.left = l + 'px';
                el.style.top = t + 'px';
                el.style.width = w + 'px';
                el.style.height = h + 'px';
                el.style.minHeight = h + 'px';
            });
            $(document).on('mouseup.resize', () => {
                $(document).off('mousemove.resize mouseup.resize');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                el.style.transition = '';
            });
        };
        ['e', 's', 'se', 'w', 'n', 'nw', 'ne', 'sw'].forEach(edge => {
            $win.find('.window-resize-' + edge).on('mousedown', e => {
                if(!$win.hasClass('maximized')) startResize(edge, e);
            });
        });

        $win.find('.window-menubar .menu-item').on('click', function(e) {
            e.stopPropagation();
            $win.find('.menu-dropdown').remove();
            const menus = { File: ['New', 'Open', 'Save', 'Exit'], Edit: ['Undo', 'Cut', 'Copy', 'Paste'], Format: ['Font', 'Word Wrap'], View: ['Zoom', 'Status Bar'], Help: ['View Help', 'About'] };
            const $ul = $('<ul class="menu-dropdown bg-white border border-slate-300 rounded shadow-lg py-1 min-w-[120px] absolute z-[100]"></ul>');
            (menus[$(this).text().trim()] || ['(empty)']).forEach(item => {
                $ul.append(`<li class="px-3 py-1.5 hover:bg-slate-100 cursor-pointer text-sm text-slate-700">${item}</li>`);
            });
            $win.append($ul);
            $ul.css({
                top: ($(this).offset().top - $win.offset().top + 24) + 'px',
                left: ($(this).offset().left - $win.offset().left) + 'px'
            });
            $(document).one('click', () => $ul.remove());
        });
    };

    const caretPos = el => {
        const sel = window.getSelection();
        if(!sel.rangeCount) return { line: 1, col: 1 };
        try {
            const range = sel.getRangeAt(0).cloneRange();
            range.selectNodeContents(el);
            range.setEnd(sel.anchorNode, sel.anchorOffset);
            const lines = range.toString().split('\n');
            return { line: Math.max(1, lines.length), col: (lines[lines.length - 1] || '').length + 1 };
        } catch(e) { return { line: 1, col: 1 }; }
    };

    const initNotepad = $win => {
        const $editor = $win.find('.notepad-editor');
        const $lnCol = $win.find('.notepad-ln-col');
        const $chars = $win.find('.notepad-chars');
        if(!$editor.length) return;
        $win.data('notepad-default', $editor.html());

        const updateStatus = () => {
            const text = ($editor[0].innerText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const lc = caretPos($editor[0]);
            $lnCol.text(`Ln ${lc.line}, Col ${lc.col}`);
            $chars.text(text.length.toLocaleString() + ' character' + (text.length !== 1 ? 's' : ''));
        };

        $editor.on('input', updateStatus);
        document.addEventListener('selectionchange', () => {
            if(document.activeElement === $editor[0]) updateStatus();
        });
        updateStatus();

        setTimeout(() => {
            $editor[0].focus();
            const sel = window.getSelection(), range = document.createRange();
            range.selectNodeContents($editor[0]);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            updateStatus();
        }, 50);

        $win.find('.notepad-bold').on('click', e => { e.preventDefault(); $editor[0].focus(); document.execCommand('bold'); });
        $win.find('.notepad-italic').on('click', e => { e.preventDefault(); $editor[0].focus(); document.execCommand('italic'); });

        const restore = () => {
            $editor.html($win.data('notepad-default'));
            bindProjectLink($win);
            updateStatus();
        };
        $win.find('.notepad-refresh').on('click', restore);
        $win.find('.notepad-tab-close').on('click', () => {
            if($win.attr('data-window-id') === 'about') {
                aboutClosedOnce = true;
                $win.find('.about-hint').remove();
                $win.data('notepad-default', $editor.html());
            }
            restore();
            $win.addClass('hidden');
        });
    };

    const dirHtml = () => {
        const tiles = Object.keys(projects).map(k => {
            const p = projects[k];
            return `<button type="button" class="browser-directory-link flex flex-col items-center justify-center p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-slate-100 transition-colors text-slate-800" data-url="${p.url}" data-title="${p.title}"><img src="images/icons/${p.icon}" alt="" class="w-12 h-12 object-contain mb-2" onerror="this.style.display='none'"/><span class="text-sm font-medium text-center">${p.title}</span></button>`;
        }).join('');
        return `<h2 class="text-lg font-semibold text-slate-800 mb-4">Projects on this site</h2><div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${tiles}</div>`;
    };

    const bindDirLinks = ($new, $iframe, $directory) => {
        $directory.find('.browser-directory-link').on('click', function(e) {
            e.preventDefault();
            const u = $(this).data('url'), t = $(this).data('title');
            if(!u) return;
            $iframe.attr('src', u).removeClass('hidden');
            $directory.addClass('hidden');
            $new.find('.browser-url-bar').val(u);
            $new.find('.browser-title').text(t);
            $new.data('current-url', u);
        });
    };

    const openBrowser = (url, title) => {
        const $new = $($('#window-browser').html());
        $new.attr('data-window-id', 'browser-' + Date.now());
        $new.find('.browser-title').text(title || 'New Tab');
        const $iframe = $new.find('.browser-iframe');
        const $directory = $new.find('.browser-directory');
        $new.data('current-url', url || '');

        if(!url) {
            $iframe.addClass('hidden');
            $directory.removeClass('hidden').html(dirHtml());
            $new.find('.browser-url-bar').val('').attr('placeholder', 'Projects only');
            bindDirLinks($new, $iframe, $directory);
        } else {
            $iframe.attr('src', url);
            $new.find('.browser-url-bar').val(url);
        }

        $new.find('.browser-url-bar').removeAttr('readonly').on('keydown', function(e) {
            if(e.key !== 'Enter') return;
            e.preventDefault();
            let u = $(this).val().trim();
            if(u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
            if(!u) return;
            $iframe.attr('src', u).removeClass('hidden');
            $directory.addClass('hidden');
            $new.data('current-url', u);
        });

        const n = $area.find('.desktop-window').length % 4;
        $new.css({ left: (40 + n * 30) + 'px', top: (40 + n * 28) + 'px', zIndex: zIndex++ });
        if(!url) {
            const pw = window.innerWidth, ph = window.innerHeight - taskbarH;
            const bw = Math.floor(pw * 0.65), bh = Math.floor(ph * 0.72);
            $new.css({ left: Math.floor((pw - bw) / 2) + 'px', top: Math.floor((ph - bh) / 2) + 'px', width: bw + 'px', minHeight: bh + 'px', height: bh + 'px', maxWidth: 'none', maxHeight: 'none' });
        }
        $area.append($new);
        wireWindow($new);
        if(isMobile()) maximizeWin($new);

        $new.find('.browser-btn-refresh').on('click', () => {
            const src = $iframe.attr('src');
            if(src) { $iframe[0].src = ''; $iframe[0].src = src; }
        });
        $new.find('.browser-btn-back').on('click', () => {
            $iframe.attr('src', '').addClass('hidden');
            $directory.html(dirHtml());
            bindDirLinks($new, $iframe, $directory);
            $directory.removeClass('hidden');
            $new.find('.browser-url-bar').val('').attr('placeholder', 'Projects only');
            $new.find('.browser-title').text('New Tab');
            $new.data('current-url', '');
        });
        $new.find('.browser-btn-forward').on('click', () => {
            try { if($new.data('current-url') && $iframe[0].contentWindow) $iframe[0].contentWindow.history.forward(); } catch(err) {}
        });
    };

    const initSettings = $win => {
        const $tiles = $win.find('.settings-wallpaper-tiles');
        $tiles.empty();
        wallpaperOptions.forEach(filename => {
            const path = 'images/' + filename;
            const $tile = $(`<div class="settings-wallpaper-tile rounded border-2 border-slate-300 overflow-hidden cursor-pointer hover:border-blue-500 bg-slate-200 aspect-video flex-shrink-0" data-wallpaper="${path}" title="${filename}"></div>`);
            $tile.css({ backgroundImage: `url(${path})`, backgroundSize: 'cover', backgroundPosition: 'center' });
            $tile.on('click', function() {
                const p = $(this).data('wallpaper');
                $('#desktop-wallpaper, #login-wallpaper').css('background-image', `url('${p}')`);
                try { localStorage.setItem('portfolio-wallpaper', p); } catch(err) {}
                $win.find('.settings-wallpaper-tile').removeClass('border-blue-500').css('border-color', '');
                $(this).addClass('border-blue-500').css('border-color', 'rgb(59 130 246)');
            });
            $tiles.append($tile);
        });
        $win.find('.settings-nav-item').on('click', function() {
            $win.find('.settings-nav-item').removeClass('text-slate-800 settings-nav-active').addClass('text-slate-600');
            $(this).removeClass('text-slate-600').addClass('text-slate-800 settings-nav-active');
            if($(this).data('settings-page') === 'home') {
                $win.find('.settings-page').addClass('hidden');
                $win.find('.settings-page[data-page="home"]').removeClass('hidden');
            }
        });
        const preview = $('#desktop-wallpaper').css('background-image');
        if(preview && preview !== 'none') $win.find('#settings-home-wallpaper-preview').css('background-image', preview);
        setTimeout(() => $win.find('.settings-search').focus(), 100);
    };

    const initCalculator = $win => {
        const $display = $win.find('[data-display]');
        let current = '0', prev = null, op = null;
        $win.find('.calc-btn').on('click', function() {
            const v = $(this).data('calc');
            if(v === 'C' || v === 'CE') { current = '0'; prev = null; op = null; }
            else if(v === 'back') current = current.length <= 1 ? '0' : current.slice(0, -1);
            else if(v === '=' && prev !== null && op) {
                const a = parseFloat(prev), b = parseFloat(current);
                if(op === '+') current = String(a + b);
                else if(op === '-') current = String(a - b);
                else if(op === '*') current = String(a * b);
                else if(op === '/') current = b !== 0 ? String(a / b) : 'Error';
                prev = null; op = null;
            } else if(v === '%') current = String(parseFloat(current) / 100);
            else if(v === '1/x') { const x = parseFloat(current); current = x !== 0 ? String(1 / x) : 'Error'; }
            else if(v === 'x2') { const y = parseFloat(current); current = String(y * y); }
            else if(v === 'sqrt') { const z = parseFloat(current); current = z >= 0 ? String(Math.sqrt(z)) : 'Error'; }
            else if(v === 'neg' && current !== '0') current = current.startsWith('-') ? current.slice(1) : '-' + current;
            else if(v === '+' || v === '-' || v === '*' || v === '/') { prev = current; op = v; current = '0'; }
            else if(v === '.') { if(current.indexOf('.') === -1) current += '.'; }
            else if(/^[0-9]$/.test(v)) current = (current === '0' && v !== '0') ? v : (current === '0' && v === '0' ? '0' : current + v);
            $display.text(current || '0');
        });
    };

    const initPaint = $win => {
        const canvas = $win.find('.paint-canvas')[0];
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        let drawing = false, lastX, lastY, color = '#000000';
        $win.find('.paint-color').on('input', function() { color = $(this).val(); });
        $win.find('.paint-clear').on('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));
        $win.find('.paint-canvas').on('mousedown', e => {
            drawing = true;
            const r = canvas.getBoundingClientRect(), s = canvas.width / r.width;
            lastX = (e.clientX - r.left) * s;
            lastY = (e.clientY - r.top) * s;
            $(document).on('mousemove.paint', e2 => {
                if(!drawing) return;
                const r2 = canvas.getBoundingClientRect(), s2 = canvas.width / r2.width;
                const x = (e2.clientX - r2.left) * s2, y = (e2.clientY - r2.top) * s2;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                lastX = x; lastY = y;
            });
            $(document).on('mouseup.paint', () => { drawing = false; $(document).off('mousemove.paint mouseup.paint'); });
        });
    };

    const escapeHtml = s => {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    };

    const initCmd = $win => {
        const $body = $win.find('.window-body');
        const $output = $win.find('.cmd-output');
        const $input = $win.find('.cmd-input');
        const promptHtml = '<span class="text-slate-300">C:\\Users\\Portfolio&gt;</span> ';
        $input.off('keydown input').on('keydown', e => {
            if(e.key === 'Backspace') {
                e.preventDefault();
                const $t = $win.find('.cmd-typed').last();
                $t.text($t.text().slice(0, -1));
                return;
            }
            if(e.key !== 'Enter') return;
            e.preventDefault();
            const $line = $win.find('.cmd-input-line').last();
            const raw = ($line.find('.cmd-typed').text() || '').trim();
            const line = raw.toLowerCase();
            $line.replaceWith(escapeHtml(raw) + '<br>');
            if(line === 'help') {
                $output.append('<span class="text-white">fullscreen - Put the page in fullscreen</span><br>');
                $output.append('<span class="text-white">help - Show this list of commands</span><br>');
                $output.append('<span class="text-white">settings - Open Settings</span><br>');
                $output.append('<span class="text-white">calculator - Open Calculator</span><br>');
                $output.append('<span class="text-white">paint - Open Paint</span><br>');
                $output.append('<span class="text-white">edge - Open browser (project links only)</span><br>');
            } else if(line === 'fullscreen') {
                if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
                else if(document.exitFullscreen) document.exitFullscreen();
            } else if(line === 'settings' || line === 'calculator' || line === 'paint') openWindow(line);
            else if(line === 'edge') openBrowser();
            $output.append(promptHtml + '<span class="cmd-input-line inline-flex items-baseline"><span class="cmd-typed"></span><span class="cmd-cursor inline-block w-px h-4 ml-0.5 align-middle bg-white" style="animation: blink 1s step-end infinite;"></span></span>');
            $body.scrollTop($body[0].scrollHeight);
        }).on('input', () => {
            const $t = $win.find('.cmd-typed').last();
            $t.text($t.text() + $input.val());
            $input.val('');
        });
        $body.on('click', () => $input[0].focus());
        setTimeout(() => $input[0].focus(), 100);
    };

    const openWindow = id => {
        let $win = $area.find(`[data-window-id="${id}"]`);
        if($win.length) {
            $win.removeClass('hidden');
            if(isMobile()) maximizeWin($win);
            else if(id === 'about' && aboutClosedOnce) {
                const n = $area.find('.desktop-window').length % 4;
                $win.css({ left: (40 + n * 30) + 'px', top: (40 + n * 28) + 'px', bottom: '', right: '' });
            }
            bringToFront($win);
            if(id === 'welcome') initCmd($win);
            if($win.find('.notepad-editor').length) setTimeout(() => { const el = $win.find('.notepad-editor')[0]; if(el) el.focus(); }, 50);
            if(id === 'settings') setTimeout(() => $win.find('.settings-search').focus(), 100);
            return;
        }

        const $tmpl = notepadIds.indexOf(id) >= 0 ? $('#window-notepad') : $('#window-' + id);
        if(!$tmpl.length) return;
        const $new = $($tmpl.html());
        if(notepadIds.indexOf(id) >= 0) {
            $new.attr('data-window-id', id);
            $new.find('.notepad-tab-label').text(id + '.md');
        }

        if(id === 'welcome') {
            const w = 760, h = 460;
            $new.css({ left: '50%', top: '50%', marginLeft: (-w / 2) + 'px', marginTop: (-h / 2) + 'px', width: w + 'px', minHeight: h + 'px', zIndex: zIndex++ });
        } else {
            const n = $area.find('.desktop-window').length % 4;
            $new.css({ left: (40 + n * 30) + 'px', top: (40 + n * 28) + 'px', zIndex: zIndex++ });
        }

        $area.append($new);
        wireWindow($new);
        if(isMobile()) maximizeWin($new);
        if(id === 'welcome') initCmd($new);
        if(id === 'settings') initSettings($new);
        if(id === 'calculator') initCalculator($new);
        if(id === 'paint') initPaint($new);

        if(notepadIds.indexOf(id) >= 0) {
            loadNotepad(id)
                .then(html => {
                    if(id === 'about' && !aboutClosedOnce) html = '<p class="about-hint"><i class="fa-solid fa-circle-exclamation"></i><span>Close this window to see the rest of the page.</span></p>' + html;
                    $new.find('.notepad-editor').html(html);
                    bindProjectLink($new);
                    initNotepad($new);
                })
                .catch(() => initNotepad($new));
        }
    };

    const launch = id => {
        if(id === 'github') return window.open(links.github, '_blank');
        if(id === 'linkedin') return window.open(links.linkedin, '_blank');
        if(id === 'edge') return openBrowser();
        openWindow(id);
        const $win = $area.find(`[data-window-id="${id}"]`).last();
        if($win.length) {
            $win.removeClass('hidden');
            bringToFront($win);
        }
    };

    $('.taskbar-app').on('click', function() { launch($(this).data('window')); });

    $('#start-btn').on('click', e => {
        e.stopPropagation();
        $('#start-menu').toggleClass('start-menu-closed');
    });
    $('#start-menu').on('click', e => e.stopPropagation());
    $('.start-menu-item').on('click', function() {
        launch($(this).data('window'));
        $('#start-menu').addClass('start-menu-closed');
    });

    $('#tray-volume').on('click', e => {
        e.stopPropagation();
        const $pop = $('#volume-popover');
        $pop.toggleClass('hidden');
        if(!$pop.hasClass('hidden') && bgMusic) {
            const pct = Math.round((bgMusic.volume || 0.7) * 100);
            $('#volume-slider').val(pct);
            $('#volume-pct').text(pct + '%');
        }
    });
    $('#volume-popover, #calendar-popover').on('click', e => e.stopPropagation());
    $('#volume-slider').on('input', function() {
        const v = parseInt($(this).val(), 10) / 100;
        if(bgMusic) bgMusic.volume = v;
        $('#volume-pct').text(Math.round(v * 100) + '%');
    });

    $(document).on('click', () => {
        $('#start-menu').addClass('start-menu-closed');
        $('#calendar-popover, #volume-popover').addClass('hidden');
    });

    $('#tray-time').on('click', e => {
        e.stopPropagation();
        const $cal = $('#calendar-popover');
        if(!$cal.hasClass('hidden')) return $cal.addClass('hidden');
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        $('#calendar-month').text(months[now.getMonth()] + ' ' + now.getFullYear());
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        let html = '<span class="font-medium text-slate-400">Su</span><span class="font-medium text-slate-400">Mo</span><span class="font-medium text-slate-400">Tu</span><span class="font-medium text-slate-400">We</span><span class="font-medium text-slate-400">Th</span><span class="font-medium text-slate-400">Fr</span><span class="font-medium text-slate-400">Sa</span>';
        for(let i = 0; i < first.getDay(); i++) html += '<span></span>';
        for(let d = 1; d <= last.getDate(); d++) {
            const cls = d === now.getDate() ? 'calendar-day-today w-8 h-8 flex items-center justify-center mx-auto' : 'w-8 h-8 flex items-center justify-center mx-auto';
            html += `<span class="${cls}">${d}</span>`;
        }
        $('#calendar-grid').html(html);
        $cal.removeClass('hidden');
    });

    const updateClock = () => {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        $('#clock').text((h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm);
        $('#date').text((now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear());
    };
    updateClock();
    setInterval(updateClock, 1000);

    if(isMobile()) {
        $('#login-screen').addClass('hidden');
        $('#desktop').removeClass('hidden');
        $('#mobile-warning').removeClass('hidden').addClass('flex');
        layoutIcons();
    }
});
