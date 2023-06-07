const urlToContractIdPath = 'https://raw.githubusercontent.com/mumose/contracts/main/url_to_contract_id.json';
const colorMap = {
  t: 'red',
  tn: 'red',
  n: 'blue',
  st: 'green',
  sn: 'green',
  sst: 'yellow',
  ssn: 'yellow',
  ssst: 'purple',
  sssn: 'purple',
  sssst: 'pink',
  ssssn: 'pink'
};

const sectionNumbers = new Set(['sn','ssn','sssn', 'ssssn', 'tn']);

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
  // if (sectionNumbers.has(label)) {
  //   hBox.style.border = `1px solid black`;
  // }
  document.body.appendChild(hBox);
}

// Function to check invalid XPaths
function getInvalidXPaths(xpaths) {
  const invalidXPaths = [];
  const filteredXPathsThatAreInvalid = [];
  for (const xpath of xpaths) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      // Check if the result has no matching elements
      if (result.snapshotLength === 0) {
        if (xpath.includes('/script') || xpath.includes('/noscript') || xpath.trim() === '') {
          filteredXPathsThatAreInvalid.push(xpath)
        }
        else {
          invalidXPaths.push(xpath);
        }
      }
    } catch (error) {
        if (xpath.includes('/script') || xpath.includes('/noscript') || xpath.trim() === '') {
          filteredXPathsThatAreInvalid.push(xpath)
        }
        else {
          invalidXPaths.push(xpath);
        }
    }
  }
  
  console.log('Total xpaths before any filtering or invalid checks', xpaths.length);
  console.log('Non problematic Invalid XPaths:', filteredXPathsThatAreInvalid);
  console.log('Number of non problematic invalid xpaths:', filteredXPathsThatAreInvalid.length);


  return invalidXPaths; // Return array of invalid XPaths
}
let rawJsonUrl;

fetch(urlToContractIdPath)
  .then(response => response.json())
  .then(data => {
    
    console.log(window.location.href);    
    var contractId = data[window.location.href];

    var highlightJsonUrl = `https://raw.githubusercontent.com/mumose/contracts/main/tagged_jsons/contract_${contractId}_highlighted.json`;
    var allJsonUrl = `https://raw.githubusercontent.com/mumose/contracts/main/labeled/contract_${contractId}_all_nodes.json`;
    const seen = new Set();

    console.log(highlightJsonUrl);
    console.log('-----------');

    fetch(highlightJsonUrl)
      .then(response2 => response2.json())
      .then(data2 => {

        var labels_coordinates = JSON.parse(JSON.stringify(data2));
        console.log(labels_coordinates);
        for (let i = 0; i < labels_coordinates.length; i++) {
          if (!seen.has(labels_coordinates[i]['seg_num'])){
            addHBox(...labels_coordinates[i]['c'], labels_coordinates[i]['labels']);
            seen.add(labels_coordinates[i]['seg_num']);
          }
        }
    });
    fetch(allJsonUrl)
    .then(response2 => response2.json())
    .then(data2 => {
      const xpaths = JSON.parse(data2.xpaths);
      const invalidXPaths = getInvalidXPaths(xpaths);
      console.log(`All filtered XPaths valid: ${invalidXPaths.length === 0}`);
      console.log('-----Length of problematic invalid xpaths --------');
      console.log(invalidXPaths.length);
      console.log(invalidXPaths);
      console.log('---- Problematic Invalid xpaths above----------')
      
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

