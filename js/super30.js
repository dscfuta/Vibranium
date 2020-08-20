// variables
let usersData;
//UI variables
const stackSelect = document.getElementById("stack");
const cardsContainer = document.getElementById('card-row');


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

}

//convert TSV to JSON
const csvToJSON = (tsv) => {

  const lines = tsv.split("\n"); //split each line into an array
  
  const result = [];

  const headers=lines[0].split("\t"); //get the headings


  lines.forEach((line, index) => {
    if (index === 0) {
      return
    }
    // for each line
    const obj = {};  //create an object
    
    const currentLine = line.split("\t"); //split each line with comma

    // for each header, get the corresponding value and match it
    headers.forEach((header, index) => {
        obj[header] = currentLine[index];
    })

    // push the current object when done
    result.push(obj)
  })

  usersData = result;
  //return result; //JavaScript object
  return result; //JSON
}

// use the JSON data passed
const useData = (data) => {
  // init cards variable
  let cards = '';

  // empty the cards container
  cardsContainer.innerHTML = '';

  const usersData = data;

  // console.log(usersData)  

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

// when the stack is chosen
const onStackChange = (event) => {
  // get the selected stack
  const selectedStack = event.target.value;

  // variables for the selected users
  let selectedUsers;

  // get the filtered array of users data
  selectedUsers = selectUsersFromStack(selectedStack);

  // pass the selected users to the userData function for rendering
  useData(selectedUsers);
}

// select users according to passed stack
const selectUsersFromStack = (stack) => { 
  let selectedUsers; 

  // if a stack is selected
  if (['Web', 'AI and ML', 'Mobile','Data Science'].includes(stack)) {
    // filter the users based on stack
    selectedUsers = usersData.filter((userData) => {
      // return the userData that matches with the passed stack
      return userData['Which Stack are you'] === stack;
    })
  }
  // if others is selected
  else if (stack === "Others") {
    // filter the users based on stack
    selectedUsers = usersData.filter((userData) => {
      // return the userData that matches with the passed stack
      return !(['Web', 'AI and ML', 'Mobile','Data Science'].includes(userData['Which Stack are you']));
    })
  }
  // if all is selected
  else {
    selectedUsers = usersData;
  }

  console.log(stack, selectedUsers);
  // return the selected users
  return selectedUsers;
}

// event listeners
// when the page loads, document should render the users
document.addEventListener("DOMContentLoaded", renderUsers);

// when a stack is chosen from the select
stackSelect.addEventListener("change", onStackChange);