let weatherChart, priceTrendChart, marketCompareChart;

function upsertChart(instance, ctx, config){
  if(instance){ instance.data=config.data; instance.options=config.options; instance.update(); return instance; }
  return new Chart(ctx, config);
}

async function run(){
  const res = await fetch('./data.json?t='+Date.now());
  const d = await res.json();

  document.getElementById('updated').textContent = '更新時間：'+new Date(d.generated_at).toLocaleString('zh-TW',{hour12:false});
  document.getElementById('region').textContent = d.scope?.region || '-';
  document.getElementById('crop').textContent = d.scope?.crop || '-';
  document.getElementById('freq').textContent = `${d.scope?.update_frequency_minutes || '-'} 分鐘`;

  const p=d.price||{};
  document.getElementById('price').innerHTML =
    `狀態：${p.status || '-'}<br>`+
    `交易日：${p.trade_date || '-'}<br>`+
    `全市場加權均價：${p.latest_price ?? '-'} ${p.unit || ''}<br>`+
    `重點市場：${p.market || '-'}（${p.market_price ?? '-'} ${p.unit || ''}）<br>`+
    `${p.message || ''}`;

  const v=d.market_volatility||{};
  document.getElementById('volatility').innerHTML =
    `狀態：${v.status || '-'}<br>`+
    `單日變動：${v.daily_change_pct ?? '-'}%<br>`+
    `近7日波動率：${v.volatility_7d_pct ?? '-'}%<br>`+
    `${v.message || ''}`;

  // 價格圖表
  const trend = p.trend_7d || [];
  priceTrendChart = upsertChart(priceTrendChart, document.getElementById('priceTrendChart'), {
    type:'line',
    data:{
      labels: trend.map(x=> (x.date||'').slice(5)),
      datasets:[{label:'均價(元/公斤)', data:trend.map(x=>x.price), borderColor:'#9cf7d5', backgroundColor:'rgba(156,247,213,0.15)', tension:0.25, borderWidth:2.2, pointRadius:3}]
    },
    options:{maintainAspectRatio:false, plugins:{legend:{labels:{color:'#bde7d8'}}}, scales:{x:{ticks:{color:'#bde7d8'}}, y:{ticks:{color:'#bde7d8'}}}}
  });

  const mkt = p.market_compare_latest || [];
  marketCompareChart = upsertChart(marketCompareChart, document.getElementById('marketCompareChart'), {
    type:'bar',
    data:{
      labels: mkt.map(x=>x.market),
      datasets:[{label:'均價(元/公斤)', data:mkt.map(x=>x.price), backgroundColor:'#7ec8ff'}]
    },
    options:{maintainAspectRatio:false, plugins:{legend:{labels:{color:'#bde7d8'}}}, scales:{x:{ticks:{color:'#bde7d8', autoSkip:true, maxTicksLimit:8}}, y:{ticks:{color:'#bde7d8'}}}}
  });

  const w=d.weather||{};
  const n=w.next24h||{};
  const series = w.next24h_series || [];
  const fromTime = series[0]?.time ? series[0].time.replace('T',' ').slice(0,16) : '-';
  const toTime = series[series.length-1]?.time ? series[series.length-1].time.replace('T',' ').slice(0,16) : '-';
  document.getElementById('weatherSummary').innerHTML =
    `預報區間：${fromTime} ~ ${toTime}<br>`+
    `風險：${n.risk_level || '-'} ${((n.risk_reasons||[]).join('、'))}<br>`+
    `溫度：${n.min_temp ?? '-'} ~ ${n.max_temp ?? '-'}°C ｜ 濕度最高：${n.max_humidity ?? '-'}% ｜ 降雨機率最高：${n.max_rain_prob ?? '-'}% ｜ 累積雨量：${n.rain_sum_mm ?? '-'} mm`;
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const labels = series.map(x=> {
    const t = (x.time||'').replace('T',' ');
    return isMobile ? t.slice(11,16) : `${t.slice(5,10)} ${t.slice(11,16)}`;
  });

  weatherChart = upsertChart(weatherChart, document.getElementById('weatherChart'), {
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'溫度°C', data:series.map(x=>x.temp), borderColor:'#7ee5bf', backgroundColor:'rgba(126,229,191,0.15)', yAxisID:'y', tension:0.25, pointRadius:isMobile?3:2.5, pointHoverRadius:isMobile?8:6, pointHitRadius:isMobile?24:8, borderWidth:isMobile?2.8:2.2},
        {label:'降雨機率%', data:series.map(x=>x.rain_prob), borderColor:'#ffc857', backgroundColor:'rgba(255,200,87,0.15)', yAxisID:'y1', tension:0.25, pointRadius:isMobile?3:2.5, pointHoverRadius:isMobile?8:6, pointHitRadius:isMobile?24:8, borderWidth:isMobile?2.8:2.2},
        {label:'降雨量mm', data:series.map(x=>x.rain_mm), borderColor:'#6ec6ff', backgroundColor:'rgba(110,198,255,0.15)', yAxisID:'y2', tension:0.25, pointRadius:isMobile?3:2.5, pointHoverRadius:isMobile?8:6, pointHitRadius:isMobile?24:8, borderWidth:isMobile?2.8:2.2}
      ]
    },
    options:{
      maintainAspectRatio:false,
      devicePixelRatio: isMobile ? 2 : 1,
      interaction:{mode:'nearest', intersect:false, axis:'x'},
      plugins:{
        tooltip:{enabled:true, mode:'nearest', intersect:false},
        legend:{position:isMobile?'bottom':'top', labels:{color:'#bde7d8', boxWidth:14, font:{size:isMobile?12:12}}}
      },
      hover:{mode:isMobile?'nearest':'point', intersect:isMobile?false:true},
      scales:{
        x:{
          ticks:{color:'#bde7d8', autoSkip:true, maxTicksLimit:isMobile?5:12, maxRotation:0, minRotation:0, font:{size:isMobile?10:11}},
          grid:{display:!isMobile}
        },
        y:{position:'left',ticks:{color:'#bde7d8', font:{size:isMobile?10:11}}},
        y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#bde7d8', font:{size:isMobile?10:11}},suggestedMin:0,suggestedMax:100},
        y2:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#9bd8ff', font:{size:isMobile?10:11}}}
      }
    }
  });

  const pest=d.pest_prevention||{};
  const focus=(pest.focus_items||[]).map(x=>`• ${x}`).join('<br>');
  const alerts=(pest.recent_alerts||[]).slice(0,5).map(x=>`<li><a href="${x.url}" target="_blank" rel="noopener">${x.title}</a>${x.time?`（${x.time.slice(0,16).replace('T',' ')}）`:''}</li>`).join('');
  const sourceLine = pest.source_url
    ? `資料來源：<a href="${pest.source_url}" target="_blank" rel="noopener">${pest.source_name || pest.source_url}</a><br>`
    : '';
  document.getElementById('pest').innerHTML =
    `狀態：${pest.status || '-'} ｜ 風險：${pest.risk_level || '-'}<br>`+
    `${(pest.risk_reasons||[]).join('、')}<br>`+
    `${sourceLine}`+
    `${pest.message || ''}<br><br>`+
    `${focus || ''}<br><br>`+
    `近期公告：<ol>${alerts || '<li>近7日無符合條件公告</li>'}</ol>`;

  const ul=document.getElementById('sources'); ul.innerHTML='';
  (d.data_sources||[]).forEach(s=>{
    const li=document.createElement('li');
    li.innerHTML = `<strong>${s.name}</strong>（${s.status}）<br><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a><br>用途：${(s.used_for||[]).join('、')}`;
    ul.appendChild(li);
  });
}

run();
setInterval(run,60000);
