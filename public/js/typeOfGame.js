const charadesButton=document.getElementById('charades');
const whitebaordButtong=document.getElementById('whiteboard');

const charadesForm=document.getElementById('charades-form');
const whiteboardForm=document.getElementById('whiteboard-form');

charadesButton.addEventListener('click', function(e){
    e.preventDefault();
    charadesForm.classList.toggle('d-none');
    whiteboardForm.classList.add('d-none');
});

whitebaordButtong.addEventListener('click', function(e){
    e.preventDefault();
    whiteboardForm.classList.toggle('d-none');
    charadesForm.classList.add('d-none');
});