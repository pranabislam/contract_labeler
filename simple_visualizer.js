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

// Function to check invalid XPaths
function getInvalidXPaths(xpaths) {
  const invalidXPaths = [];
  for (const xpath of xpaths) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      // Check if the result has no matching elements
      if (result.snapshotLength === 0) {
        invalidXPaths.push(xpath); // Add invalid XPath to the array
      }
    } catch (error) {
      invalidXPaths.push(xpath); // Add invalid XPath to the array
    }
  }
  return invalidXPaths; // Return array of invalid XPaths
}
// Function to check invalid XPaths and change font color
function checkInvalidXPaths(xpaths, color) {
  const invalidXPaths = [];
  for (const xpath of xpaths) {
    try {
      document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
      const elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < elements.snapshotLength; i++) {
        elements.snapshotItem(i).style.color = color;
      }
    } catch (error) {
      invalidXPaths.push(xpath); // Add invalid XPath to the array
    }
  }
  return invalidXPaths; // Return array of invalid XPaths
}
let rawJsonUrl;

fetch(fileUrl)
  .then(response => response.json())
  .then(data => {
    
    console.log(window.location.href);
    console.log(typeof window.location.href);

    const highlightJsonUrl = data[window.location.href][0];
    const allJsonUrl = data[window.location.href][1];


    console.log(highlightJsonUrl);
    console.log('-----------');

    fetch(highlightJsonUrl)
      .then(response2 => response2.json())
      .then(data2 => {
        const coordinates = JSON.parse(data2.c);
        const labels = JSON.parse(data2.labels);
        
        for (let i = 0; i < coordinates.length; i++) {
          addHBox(...coordinates[i], labels[i]);
        }
    });
    fetch(allJsonUrl)
    .then(response2 => response2.json())
    .then(data2 => {
      const xpaths = JSON.parse(data2.xpaths);
      const invalidXPaths = getInvalidXPaths(xpaths);
      console.log('---------------------');
      console.log(invalidXPaths.length);
      console.log(`All XPaths valid: ${invalidXPaths.length === 0}`);
      console.log(invalidXPaths);
      console.log('----------------------')
      
      if (invalidXPaths.length === 0) {
        const dialogWindow = window.open('', 'myDialog', 'width=400,height=200');
        dialogWindow.document.write('<p>All xpaths were located!</p>');
        dialogWindow.document.close();
        setTimeout(function() {
          dialogWindow.close();
        }, 4000);
      }
      else {
        const dialogWindow = window.open('', 'myDialog', 'width=400,height=200');
        dialogWindow.document.write('<p>There are some invalid xpaths</p>');
        dialogWindow.document.close();
        setTimeout(function() {
          dialogWindow.close();
        }, 4000);
      }

    });
});

