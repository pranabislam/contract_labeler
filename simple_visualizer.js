const fileUrl = 'https://raw.githubusercontent.com/pranabislam/file_host/main/url_to_json_url.json';
const colorMap = {
  t: 'red',
  n: 'blue',
  st: 'green',
  sn: 'green',
  sst: 'yellow',
  ssn: 'yellow',
  ssst: 'purple',
  sssn: 'purple'
};

const sectionNumbers = new Set(['sn','ssn','sssn']);

function addHBox(t,l,w,h,label){
  
  const hBox = document.createElement('div');
  hBox.style.position = 'absolute';
  hBox.style.top = t * document.documentElement.scrollHeight + 'px';
  hBox.style.left = l * document.documentElement.scrollWidth + 'px';
  hBox.style.width = w * document.documentElement.scrollWidth + 'px';
  hBox.style.height = h * document.documentElement.scrollHeight + 'px';
  hBox.style.backgroundColor = colorMap[label];
  hBox.style.opacity = '0.5';
  hBox.style.zIndex = '99999';
  if (sectionNumbers.has(label)) {
    hBox.style.border = `2px solid black`;
  }
  document.body.appendChild(hBox);
}

let rawJsonUrl;

fetch(fileUrl)
  .then(response => response.json())
  .then(data => {
    
    console.log(window.location.href);
    console.log(typeof window.location.href);

    const rawJsonUrl = data[window.location.href];
    console.log(rawJsonUrl);
    console.log('-----')

    fetch(rawJsonUrl)
      .then(response2 => response2.json())
      .then(data2 => {
        const coordinates = JSON.parse(data2.c);
        const labels = JSON.parse(data2.labels);
        
        for (let i = 0; i < coordinates.length; i++) {
          addHBox(...coordinates[i], labels[i]);
        }
    });

});

