const API_URL = 'https://rithm-jeopardy.herokuapp.com/api'
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;


// categories is the main data structure for the app; it looks like this:
//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    try{
        let res = await axios.get(`${API_URL}/categories?count=100`)
        const catIds = res.data.map(c => c.id);
        return _.sampleSize(catIds, NUM_CATEGORIES);
    } catch(err){
        console.error("Unable to retrieve Category data.", err);
    }
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    try{
        const res = await axios.get(`${API_URL}/category?id=${catId}`)
        
        let cat = res.data;
        
        let randomClues = _.sampleSize(cat.clues, NUM_CLUES_PER_CAT).map(c => ({
          question: c.question,
          answer: c.answer,
          showing: null
        }));
    
        return { title: cat.title, clues: randomClues };

    } catch(err){
        console.error(`Unable to get Category data from category id of ${catId}`)
    }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initially, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    try{
        hideLoadingView();
        let $tr = $("<tr>");
        for (let category of categories) {
            $tr.append($("<th>").text(category.title));
        }
        
        $("#game thead").append($tr);
        $("#game tbody").empty();
        
        for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
            let $tr = $("<tr>");
        
            for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
            $tr.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).append($("<i>").addClass("fa fa-question-circle fa-2x")));
            }   

            $("#game tbody").append($tr);
        }

    } catch(err){
        console.error(`Error while attempting to build table:`,err);
    }
    

}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    let $tgt = $(evt.target);
    let id = $tgt.attr('id');
    let [catId, clueId] = id.split('-');
    let clue = categories[catId].clues[clueId];

    let message;

    if(!clue.showing){
        message = clue.question;
        clue.showing = 'question';
    } else if(clue.showing === 'question'){
        message = clue.answer;
        clue.showing = 'answer';
        $tgt.addClass('disabled');
    } else {
        return
    }
    $tgt.html(message)
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $("#game thead").empty();
    $("#game tbody").empty();

    $("#loader").show();
    $("#start")
    .addClass("disabled")
    .text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $('#start').show();
    $('#start').removeClass('disabled').text("Restart Game");
    $('#loader').hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    try{
      let loading = $("start").text() === 'Loading...';
        if(!loading){
        showLoadingView();
        let catIds = await getCategoryIds();

        categories = [];

        for(let id of catIds){
            categories.push(await getCategory(id));
        }
        fillTable();  
        }
    } catch(err) {
        console.error(`Setup failed`, err);
    }
}

/** On click of start / restart button, set up game. */

$('#start').on('click', setupAndStart);

/** On page load, add event handler for clicking clues */

$(async () => {
    $('#game').on('click', 'td', handleClick);
});