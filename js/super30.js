// the pagination
// add event listener to the pagination box

// get the nav element
const paginationNav = document.getElementById('pagination');

// variable
let currentPage = 1;

const handleNavigation = (e) => {
  
  e.preventDefault();
}

// add event listener
// to the pagination nav
paginationNav.addEventListener("click", handleNavigation);



