let weatherChart;

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
  document.getElementById('price').innerHTML = `狀態：${p.status || '-'}<br>${p.message || ''}`;

  const v=d.market_volatility||{};
  document.getElementById('volatility').innerHTML = `狀態：${v.status || '-'}<br>${v.message || ''}`;

  const w=d.weather||{};
  const n=w.next24h||{};
  document.getElementById('weatherSummary').innerHTML =
    `風險：${n.risk_level || '-'} ${((n.risk_reasons||[]).join('、'))}<br>`+
    `溫度：${n.min_temp ?? '-'} ~ ${n.max_temp ?? '-'}°C ｜ 濕度最高：${n.max_humidity ?? '-'}% ｜ 降雨機率最高：${n.max_rain_prob ?? '-'}% ｜ 累積雨量：${n.rain_sum_mm ?? '-'} mm`;

  const series = w.next24h_series || [];
  weatherChart = upsertChart(weatherChart, document.getElementById('weatherChart'), {
    type:'line',
    data:{
      labels: series.map(x=> (x.time||'').slice(11,16)),
      datasets:[
        {label:'溫度°C', data:series.map(x=>x.temp), borderColor:'#7ee5bf', yAxisID:'y'},
        {label:'降雨機率%', data:series.map(x=>x.rain_prob), borderColor:'#ffc857', yAxisID:'y1'}
      ]
    },
    options:{
      plugins:{legend:{labels:{color:'#bde7d8'}}},
      scales:{
        x:{ticks:{color:'#bde7d8'}},
        y:{position:'left',ticks:{color:'#bde7d8'}},
        y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#bde7d8'}}
      }
    }
  });

  const pest=d.pest_prevention||{};
  document.getElementById('pest').innerHTML = `狀態：${pest.status || '-'} ｜ 風險：${pest.risk_level || '-'}<br>${pest.message || ''}`;

  const ul=document.getElementById('sources'); ul.innerHTML='';
  (d.data_sources||[]).forEach(s=>{
    const li=document.createElement('li');
    li.innerHTML = `<strong>${s.name}</strong>（${s.status}）<br><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a><br>用途：${(s.used_for||[]).join('、')}`;
    ul.appendChild(li);
  });
}

run();
setInterval(run,60000);
