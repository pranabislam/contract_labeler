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
    var currXpath = data[0]['xpaths'];
    var currIdx = 0;
    var segments = [];
    const colors = ['blue', 'green', 'pink', 'orange', 'red'];

    for (let i = 24; i < 26; i++) {
        xpath = data[i]['xpaths'];
        fullText = data[i]['text'];
        token = data[i]['nodes'];
        pred = data[i]['preds'];

        // New xpath
        if (xpath != currXpath){
            
            
            // reset all variables
            currXpath = xpath;
            currIdx = 0;
            // reset segments now
            segments = [];
        }
        

        /* 
        Okay I can change my approach
        I was halfway through writing code that always locates the curr xpaths and does token length calc (without actualy checking if curr token)
        is the same. This can work under the assumption my ordering and everything makes sense which I think it does. Another approach would 
        be to construct the segments from the tokens directly and then just modify the inner HTML directly. I think this is a decent way that 
        relies on the same assumptions but feels weird. But I think the second approach is much more natural given the json structure of the HTML TBH

        One approach locates an xpath and iteratively segments it based on incoming tokens, the other approach iteratively constructs the text for the node
        via the tokens. I think they are very similar in assumptions and either would be fine. Just need to think through which makes more sense
        to use here

        I think the first approach would be better for error catching if there is a difference between the current HTML and the 
        dataframe / json scraped and prediction run on after... It might be less convenient to code but I think we need to absolutely stick 
        to the HTML as it currently stands. Maybe maybe not though given how the pipeline would work it might make no difference (operating on a processed
        HTML is prob the same)
        */
        //console.log(xpaths, fullText, token, pred);
        result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        firstMatchingElement = result.singleNodeValue;
        if (firstMatchingElement){
            textContent = firstMatchingElement.textContent;
            substringToUnderline = textContent.substring(currIdx, currIdx + token.length);
            console.log(substringToUnderline, token, currIdx, fullText, xpath);
            underlinedSubstring = `<span style="text-decoration: underline; color: red;">${substringToUnderline}</span>`;
            modifiedTextContent = textContent.replace(substringToUnderline, underlinedSubstring);
            firstMatchingElement.innerHTML = modifiedTextContent;
            
            currIdx += token.length;
        }
    }
});

// observations:
// 1. cant highlight or change the text on top o fthe document (the top left; this is like some fundamental HTML information and cant change this; i think i have to start after the body tag)
// okay for some reason this current code always highlights the LAST token in the set when it should be all tokens
chatgpt answer below that shows how to change the segments of a HTML node to different colors (almost exactly what i need here)
To color the first 20 characters blue, the second 20 characters green, the third 20 characters pink, the fourth 20 characters orange, and the final 20 characters red in the HTML node obtained using `document.evaluate`, you can follow these steps:

1. Get the text content of the HTML node.
2. Split the text into segments of 20 characters each.
3. Wrap each segment in a `<span>` element with the corresponding color.
4. Replace the original text content with the modified content.

Here's the JavaScript code to achieve this:

```javascript
// Assuming you have already obtained the 'result' using document.evaluate

// Step 1: Get the text content of the HTML node
const targetNode = result.singleNodeValue;
const textContent = targetNode.textContent;

// Step 2: Split the text into segments of 20 characters each
const segmentLength = 20;
const segments = [];
for (let i = 0; i < textContent.length; i += segmentLength) {
  segments.push(textContent.substr(i, segmentLength));
}

// Step 3: Wrap each segment in a <span> element with the corresponding color
const colors = ['blue', 'green', 'pink', 'orange', 'red'];
const coloredContent = segments.map((segment, index) => {
  const color = colors[index % colors.length];
  return `<span style="color: ${color};">${segment}</span>`;
});

// Step 4: Replace the original text content with the modified content
targetNode.innerHTML = coloredContent.join('');
```

In this code, we split the text content into segments of 20 characters each and then wrap each segment with a `<span>` element with the corresponding color. The `colors` array is used in a cyclic manner to repeat the colors for each segment.

Please note that if the original HTML content contains HTML tags or entities, the above approach might not work as expected. In such cases, you might need to consider a more sophisticated HTML parsing approach or utilize a library like DOMParser or jQuery to manipulate the HTML content safely. Also, keep in mind that manipulating the content using `innerHTML` can lead to security risks, especially when dealing with user-generated content.