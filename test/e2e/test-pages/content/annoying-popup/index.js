const url = new URL(location.href);
const manual = !!url.searchParams.get('manual')

let backdrop;
let backdropParent;

function showAnnoyingPopup(){
    document.body.classList.add('has-popup');
    backdropParent.appendChild(backdrop);
}

addEventListener('load', () => {
    backdrop = document.getElementById('backdrop');
    backdropParent = backdrop.parentElement;
    backdrop.remove();
    document.getElementById('showPopup').addEventListener('click', showAnnoyingPopup);
    if(!manual){
        setTimeout(showAnnoyingPopup, 1000)
    }
});