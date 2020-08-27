// variables
let usersData, paginationState, selectedUsers, pageData;
//UI variables
const stackSelect = document.getElementById("stack");
const cardsContainer = document.getElementById('card-row');
// pagination tab
const pageNav = document.getElementById('page-tab-parent');


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

  selectedUsers = usersData;
  // set pagination state
  paginationState = {
    'data': selectedUsers,
    'currentPage':1,
    'cardsPerPage': 8
  };

  //return result; //JavaScript object
  return result; //JSON
}

// when the stack is chosen
const onStackChange = (event) => {
  // get the selected stack
  const selectedStack = event.target.value;

  // variables for the selected users
  // let selectedUsers;

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

  paginationState.currentPage = 1;

  pageData.noOfPages = Math.ceil(selectedUsers.length/paginationState.cardsPerPage)

  console.log(stack, selectedUsers);
  // return the selected users
  return selectedUsers;
}

// use the JSON data passed
const useData = (data) => {
  // init cards variable
  let cards = '';

  // empty the cards container
  cardsContainer.innerHTML = '';

  // get pagination data
  pageData = pagination(paginationState,data)

  // get the data
  const usersData = pageData.cardList;

  usersData.forEach((userData) => {
    
    const items = {
      fullname: userData['Full Name'],
      stack: userData['Which Stack are you'],
      department: userData['Department '],
      level: userData['Level'],
      bio: userData['Your Bio'],
      image_url: userData['Your Image (your image will be Published alongside your bio)']
    }

    // console.log(items.fullname, ": ", items.image_url);
    cards += `<div class="my-3 col-sm-6 col-md-4 col-lg-3 card-item">
    <div class="card hovercard">
        <div class="cardheader"></div>
        <div class="avatar">
            <img src="${items.image_url}" src="src/images/assets/team/avatar.png">
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

  // create pagination
  createPageTabs(pageData.noOfPages);
}

// for the pagination
const pagination = (state, data) => {
  const userData = data, 
  currentPage = state.currentPage, 
  cardsPerPage = state.cardsPerPage;

  // the starting and ending index
  let cardListStart = (currentPage - 1) * cardsPerPage;
  let cardListEnd = cardListStart + cardsPerPage;


  // trim the cards
  let cardList = userData.slice(cardListStart, cardListEnd);
  
  // get the number of pages
  let noOfPages = Math.ceil(data.length/cardsPerPage);

  return {
    cardList,
    noOfPages
  }
}

// create the pagination tabs
const createPageTabs = (noOfPages) => {
  // get the wrapping ul and the last li
  const parent = document.getElementById('page-tab-parent');

  let tabs = '',
  prevTab = `
  <li class="page-item">
    <a class="page-link prev-page" id="prev-page-link" href="#" aria-disabled="false">&laquo;</a>
  </li>`, 
  nextTab =`
  <li class="page-item" id="next-page">
    <a class="page-link next-page" id="next-page-link" href="#">&raquo;</a>
  </li>`;

  for (let i=1; i <= noOfPages; i++) {
    // if the particular tab is a the current page, make it active
    tabs += i===paginationState.currentPage? `
    <li class="page-item active"><a class="page-link" href="#">${i}</a></li>
    ` :`
    <li class="page-item"><a class="page-link" href="#">${i}</a></li>
    `;
  }

  if (paginationState.currentPage <= 1) {
    // if current page is the first, disabled the previous tab
   prevTab= `
    <li class="page-item disabled">
      <a class="page-link prev-page" id="prev-page-link" href="#" aria-disabled="true">&laquo;</a>
    </li>`
  }  
  if (paginationState.currentPage >= noOfPages) {
    // if current page is the last, disabled the next tab
    nextTab = `
    <li class="page-item disabled" id="next-page">
      <a class="page-link next-page" id="next-page-link" href="#">&raquo;</a>
    </li>`
  }
  // reset parent inner HTML
  parent.innerHTML = `${prevTab} ${tabs} ${nextTab}`
}

const goToPage = (e) => {
  // prevent default linking
  e.preventDefault();

  const tab = e.target.closest('a');

  if (tab.id === 'next-page-link') {
    paginationState.currentPage ++;
  }else if (tab.id === 'prev-page-link') {
    paginationState.currentPage --;
  }else {
    paginationState.currentPage = Number(tab.textContent);
  }

  useData(selectedUsers);
}
// event listeners
// when the page loads, document should render the users
document.addEventListener("DOMContentLoaded", renderUsers);

// when a stack is chosen from the select
stackSelect.addEventListener("change", onStackChange);

// when a pagination link is clicked
pageNav.addEventListener('click', goToPage)