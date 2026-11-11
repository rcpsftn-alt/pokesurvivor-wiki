import sys,json
from playwright.sync_api import sync_playwright
OUT='/tmp/claude-0/-home-claude/e03973ac-94f3-567b-8ab4-293a02255c54/scratchpad/shots/'
URL='file://'+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/docs/index.html'
errs=[]
with sync_playwright() as pw:
    b=pw.chromium.launch()
    def page(w,h,scheme='light'):
        c=b.new_context(viewport={'width':w,'height':h},color_scheme=scheme,device_scale_factor=1)
        p=c.new_page();p.on('pageerror',lambda e:errs.append(str(e)));p.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None);return p
    p=page(1360,900)
    p.goto(URL);p.wait_for_selector('#tb tr.row')
    r={}
    r['rows0']=p.locator('#tb tr.row').count()
    p.screenshot(path=OUT+'d1_pokedex.png')
    # sort by total
    p.click('th[data-sort="bst"]');r['top_total']=p.locator('#tb tr.row td.nm').first.inner_text()
    p.fill('#q','salameche');p.wait_for_timeout(250);r['search']=p.locator('#cnt').inner_text()
    p.fill('#q','');p.wait_for_timeout(250)
    # range filter
    p.click('.rg summary');p.fill('[data-r="df"][data-m="0"]','150');p.wait_for_timeout(300);r['df150']=p.locator('#cnt').inner_text()
    p.click('#rs');r['reset']=p.locator('#cnt').inner_text()
    # incremental
    p.evaluate("document.querySelector('.tw').scrollTop=1e6");p.wait_for_timeout(400);r['rows_after_scroll']=p.locator('#tb tr.row').count()
    # cards
    p.click('[data-view="cards"]');p.wait_for_selector('.pc');r['cards']=p.locator('.pc').count();p.screenshot(path=OUT+'d2_cards.png')
    p.click('[data-view="table"]')
    # fiche
    p.click('#tb tr.row[data-p="25"] td.nm') if p.locator('#tb tr.row[data-p="25"]').count() else p.goto(URL+'#/pokemon/25')
    p.wait_for_selector('dialog[open] .hero');r['fiche']=p.locator('.hero h2').inner_text();r['hash']=p.evaluate('location.hash')
    p.wait_for_timeout(300);p.screenshot(path=OUT+'d3_fiche.png')
    p.select_option('#ns','1');r['nature']=p.locator('.nr').inner_text().replace('\n',' ')[:90]
    p.click('[data-cmp="25"]');p.keyboard.press('ArrowRight');r['next']=p.locator('.hero h2').inner_text()
    p.click('[data-cmp]');p.click('[data-step] >> nth=1');p.click('[data-cmp]')
    p.keyboard.press('Escape');p.wait_for_timeout(100);r['closed']=p.evaluate("[!document.getElementById('dlg').open,location.hash]")
    r['tray']=p.locator('#tray').inner_text().replace('\n',' ')
    p.click('#tray [data-go="comparer"]');p.wait_for_selector('dialog[open] .lg');p.wait_for_timeout(250);p.screenshot(path=OUT+'d4_compare.png');r['cmp_polys']=p.locator('dialog svg polygon').count()
    p.keyboard.press('Escape')
    # fav + types
    p.click('#tb .fv[data-fav="1"]');p.click('#tb .fv[data-fav="4"]');r['fav_pressed']=p.locator('#tb .fv[aria-pressed="true"]').count()
    for sec in ['talents','attaques','types','objets','ennemis','succes','arceus','nouveautes']:
        p.click(f'#nav a[data-r="{sec}"]');p.wait_for_timeout(250)
        r['sec_'+sec]=[p.locator(f'#s-{sec}').is_visible(),p.title(),p.locator(f'#s-{sec} tr, #s-{sec} .nv').count()]
        p.screenshot(path=OUT+f'd5_{sec}.png')
    p.click('#nav a[data-r="types"]');r['team']=p.locator('#tcv tbody tr').count()
    # global search
    p.fill('#gq','pika');p.wait_for_selector('#gres a');r['gs']=p.locator('#gres').inner_text().replace('\n',' | ')[:160]
    p.screenshot(path=OUT+'d6_search.png');p.keyboard.press('Enter');p.wait_for_selector('dialog[open]');r['gs_enter']=p.locator('.hero h2').inner_text();p.keyboard.press('Escape')
    p.fill('#gq','lévitation');p.wait_for_selector('#gres a');p.keyboard.press('Enter');p.wait_for_selector('dialog[open]');r['talent']=p.locator('.hero h2').inner_text()+' / chips '+str(p.locator('dialog .chip2').count());p.keyboard.press('Escape')
    # move modal
    p.goto(URL+'#/attaque/meteor-mash');p.wait_for_selector('dialog[open]');r['move']=p.locator('dialog .sheet').inner_text().replace('\n',' ')[:230];p.screenshot(path=OUT+'d7_move.png');p.keyboard.press('Escape');p.wait_for_timeout(150)
    r['after_move_close']=p.evaluate('location.hash')
    # lang
    p.click('#nav a[data-r="pokedex"]');p.select_option('#lg','en');r['en']=p.locator('#tb tr.row td.nm').first.inner_text();p.select_option('#lg','fr')
    # theme
    p.click('#thm');p.click('#thm');r['theme']=p.evaluate('document.documentElement.dataset.theme');p.wait_for_timeout(100);p.screenshot(path=OUT+'d8_dark.png');p.click('#thm')
    # share roundtrip
    p.click('#nav a[data-r="attaques"]');p.select_option('#mty','fire');p.click('#shr');url=p.input_value('#shu');r['share']=url[:60]+'…'
    p2=page(1360,900);p2.goto(URL+'#'+url.split('#')[1]);p2.wait_for_selector('#mtb tr');r['share_restore']=[p2.locator('#s-attaques').is_visible(),p2.input_value('#mty'),p2.locator('#mtb tr').count(),p2.evaluate('location.hash')]
    # legacy links
    p2.goto(URL+'#25');p2.wait_for_selector('dialog[open]');r['legacy']=p2.locator('.hero h2').inner_text()
    # csv
    p.keyboard.press('Escape');p.click('#nav a[data-r="pokedex"]');p.select_option('#gen','1')
    with p.expect_download() as d: p.click('#csv')
    txt=open(d.value.path(),encoding='utf8',newline='').read();r['csv']=[len(txt.split('\r\n')),txt.split('\r\n')[1]]
    # arceus sim
    p.click('#nav a[data-r="arceus"]');p.fill('#sp','290');r['sim']=p.locator('#simo').inner_text().replace('\n',' ')[:200];r['plates']=p.locator('#plq .chip2').count();r['rank']=p.locator('#rkb tr').count()
    # news filter
    p.click('#nav a[data-r="nouveautes"]');p.click('[data-nk="fix"]');r['news_fix']=p.locator('.nv').count();p.click('[data-nk=""]');r['news_all']=p.locator('.nv').count();r['news_sprites']=p.locator('#nvl .sp').count()
    # mobile
    m=page(390,800);m.goto(URL);m.wait_for_selector('#tb tr.row');m.screenshot(path=OUT+'m1_pokedex.png')
    r['m_overflow']=m.evaluate('document.documentElement.scrollWidth-innerWidth')
    m.goto(URL+'#/pokemon/6');m.wait_for_selector('dialog[open] .hero');m.wait_for_timeout(300);m.screenshot(path=OUT+'m2_fiche.png')
    m.keyboard.press('Escape');m.click('[data-view="cards"]');m.wait_for_timeout(200);m.screenshot(path=OUT+'m3_cards.png')
    m.click('#nav a[data-r="nouveautes"]');m.wait_for_timeout(200);m.screenshot(path=OUT+'m4_news.png');r['m_overflow_news']=m.evaluate('document.documentElement.scrollWidth-innerWidth')
    dk=page(390,800,'dark');dk.goto(URL+'#/arceus');dk.wait_for_timeout(300);dk.screenshot(path=OUT+'m5_arceus_dark.png');r['m_overflow_arceus']=dk.evaluate('document.documentElement.scrollWidth-innerWidth')
    b.close()
for k,v in r.items():print(k,'=',v)
print('ERRORS',len(errs),errs[:5])
