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

const sectionNumbers = new Set(['sn','ssn','sssn', 'ssssn', 'tn']);

var predJsonURL = `https://raw.githubusercontent.com/pranabislam/file_host/main/testing_contract_81.json`;    

fetch(predJsonURL)
  .then(response => response.json())
  .then(data => {
    
    //console.log(window.location.href);
    
    var data = JSON.parse(JSON.stringify(data));
    //console.log(labels_coordinates);
    //for (let i = 0; i < data.length; i++) {
    var startIdx = 24;
    var currXpath = data[startIdx]['xpaths'];
    var currIdx = 0;
    var segments = [];
    const colors = ['blue', 'green', 'pink', 'orange', 'red'];

    for (let i = startIdx; i < data.length; i++) {
        xpath = data[i]['xpaths'];
        fullText = data[i]['text'];
        token = data[i]['nodes'];
        pred = data[i]['preds'];

        result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        firstMatchingElement = result.singleNodeValue;
        
        // New xpath
        if ((xpath != currXpath) && (firstMatchingElement)){
          var coloredContent = segments.map((segment, index) => {
            var color = colors[index % colors.length];
            return `<span style="color: ${color};">${segment}</span>`;
          });
          console.log('Within the assigner part');
          console.log(segments);
          // Step 4: Replace the original text content with the modified content
          firstMatchingElement.innerHTML = coloredContent.join('');

          // reset all variables
          currXpath = xpath;
          currIdx = 0;
          // reset segments now
          segments = [];
      } // consider putting this if statement within the other one since it references firstmatchingelement

        if (firstMatchingElement){
            var textContent = firstMatchingElement.textContent;
            
            var segment = textContent.substring(currIdx, currIdx + token.length);
            segments.push(segment);
            
            //console.log(substringToUnderline, token, currIdx, fullText, xpath);
            currIdx += token.length;
        }
    }
});