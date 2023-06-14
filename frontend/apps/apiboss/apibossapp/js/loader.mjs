/**
 * Spinner : add, before loading the data
 */
const beforeLoading = async () => {
    if (!document.querySelector('.spinner')) {
        const div = document.createElement('div');
        div.classList.add("spinner");
        div.innerHTML = '<img class="loading-spinner" src="../apibossapp/img/loading_spinner.svg"/>';
        document.body.appendChild(div);
    }
}
/**
 * Spinner : remove, after loading the data
 */
const afterLoading = async () => {
    if (document.querySelector('.spinner')) {
        const spinnerElement = document.querySelector('.spinner');
        document.body.removeChild(spinnerElement);
    }
}
export const loader = { beforeLoading, afterLoading }