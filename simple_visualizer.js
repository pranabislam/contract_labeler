const fileUrl = 'https://raw.githubusercontent.com/pranabislam/file_host/main/contract_saved.json';
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
  hBox.style.top = t + 'px';
  hBox.style.left = l + 'px';
  hBox.style.width = w + 'px';
  hBox.style.height = h + 'px';
  hBox.style.backgroundColor = colorMap[label];
  hBox.style.opacity = '0.5';
  hBox.style.zIndex = '99999';
  if (sectionNumbers.has(label)) {
    hBox.style.border = `2px solid black`;
  }
  document.body.appendChild(hBox);
}

fetch(fileUrl)
  .then(response => response.json())
  .then(data => {
    // Work with the 'data' object here
    const coordinates = JSON.parse(data.c);
    const labels = JSON.parse(data.labels);
    
    for (let i = 0; i < coordinates.length; i++) {
      const subList = [];
      for (let j = 0; j < coordinates[i].length; j++) {
        const entry = coordinates[i][j];
        const value = parseFloat(entry.replace("px", ""));
        subList.push(isNaN(value) ? entry : value);
      }
      subList.push(labels[i]);
      addHBox(...subList);
    }
});