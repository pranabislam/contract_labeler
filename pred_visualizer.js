const urlToContractIdPath = 'https://raw.githubusercontent.com/mumose/contracts/main/url_to_contract_id.json';
const colorMap = {
    t: [255, 0, 0],        // Red
    tn: [255, 0, 0],       // Red
    n: [0, 0, 255],        // Blue
    st: [0, 128, 0],       // Green
    sn: [0, 128, 0],       // Green
    sst: [255, 255, 0],    // Yellow
    ssn: [255, 255, 0],    // Yellow
    ssst: [128, 0, 128],   // Purple
    sssn: [128, 0, 128],   // Purple
    sssst: [255, 192, 203], // Pink
    ssssn: [255, 192, 203]  // Pink
  };

//const sectionNumbers = new Set(['sn','ssn','sssn', 'ssssn', 'tn']);

function addHBox(t,l,w,h,tagged_sequence,pred){
  
  const hBox = document.createElement('div');
  hBox.style.position = 'absolute';
  hBox.style.top = t * document.documentElement.scrollHeight + 'px';
  hBox.style.left = l * document.documentElement.scrollWidth + 'px';
  hBox.style.width = w * document.documentElement.scrollWidth + 'px';
  hBox.style.height = h * document.documentElement.scrollHeight + 'px';
  hBox.style.backgroundColor = `rgba(${colorMap[pred.substring(2)].join(',')}, 0.5)`;
  hBox.style.zIndex = '99999';
  if (tagged_sequence != pred) {
    hBox.style.border = `2px solid rgba(255, 0, 0, 1)`;
  }
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

    var highlightJsonUrl = `https://raw.githubusercontent.com/mumose/contracts/main/preds/preds_jsons/contract_${contractId}_preds.json`;
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
            addHBox(...labels_coordinates[i]['c'], labels_coordinates[i]['tagged_sequence'], labels_coordinates[i]['preds']);
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
