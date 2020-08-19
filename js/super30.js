// functions 
// to render the users
const renderUsers = () => {
  //I dowload the tsv file of the document online and converted it to json for it to be usable

// get the file
const fetchFile =async (url) => {
  const res = await fetch(url);

  const file = await res.text();

  return file;
}


fetchFile("./DSCfuta  Super 30 (Responses) - Form Responses 1.tsv")
// then convert it to JSON
.then(fileInTSV => csvToJSON(fileInTSV))
// then pass the JSON data to the function that will use it
.then(fileinJSON => useData(fileinJSON))
.catch(err => console.log(err));



//convert TSV to JSON
const csvToJSON = (tsv) => {

    let lines = tsv.split("\n"); //split each line into an array
    
    let result = [];
  
    let headers=lines[0].split("\t"); //get the headings


    lines.forEach((line, index) => {
      if (index === 0) {
        return
      }
      // for each line
      let obj = {};  //create an object
      
      let currentLine = line.split("\t"); //split each line with comma

      // for each header, get the corresponding value and match it
      headers.forEach((header, index) => {
          obj[header] = currentLine[index];
      })

      // push the current object when done
      result.push(obj)
    })

 
    //return result; //JavaScript object
    return JSON.stringify(result); //JSON
}


const useData = (data) => {

  const cardsContainer = document.getElementById('card-row');
  
  let cards = '';

  const usersData = JSON.parse(data);

  console.log(usersData)  

  usersData.forEach((userData) => {
    // console.log(userData)
    const items = {
      fullname: userData['Full Name'],
      stack: userData['Which Stack are you'],
      department: userData['Department '],
      level: userData['Level'],
      bio: userData['Your Bio'],
      image_url: userData['Your Image (your image will be Published alongside your bio)']
    }

    // console.log(items)
    cards += `<div class="my-3 col-sm-6 col-md-4 col-lg-3 card-item">
    <div class="card hovercard">
        <div class="cardheader"></div>
        <div class="avatar">
            <img src="./images/assets/team/avatar.png" alt="lead avatar" src="src/images/assets/team/avatar.png">
        </div>
        <div class="info">
            <div class="title">
                <h5>${items.fullname}</h5>
                <p >
                    <p class="stack">${items.stack}</p>
                    <p class="department"> ${items.department}, ${items.level}L</p>
                </p>
            </div>
            <div class="desc">${items.bio}</div>
        </div>
        <div class="bottom">
            <ul class="social-list__inline mt-4">
                <li>
                    <a href="#" target="_blank" rel="noopener">
                        <i class="fab fa-twitter"></i>
                    </a>
                </li>
                <li>
                    <a href="#" target="_blank" rel="noopener">
                        <i class="fab fa-instagram"></i>
                    </a>
                </li>
                <li>
                    <a href="#" target="_blank" rel="noopener">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                </li>
            </ul>
        </div>
      </div>
    </div>`;
  })

  // insert it into the DOM
  cardsContainer.innerHTML = cards;
}

}



// event listeners
// when the page loads, document should render the users
document.addEventListener("DOMContentLoaded", renderUsers)