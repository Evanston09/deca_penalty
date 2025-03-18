
function Footer() {
    return (
        <footer className="text-center m-4 text-gray-200 flex flex-col items-center">
            <p>
                Created with ❤️ by Weddington DECA (<a className='hover:underline text-deca-blue' href="https://evankim.me">Evan Kim</a>)
            </p>
            <p className='text-xs text-gray-400'>Your event is processed entirely on the client—nothing is uploaded or shared! :) See the <a href="https://github.com" className="text-deca-blue hover:underline">source code</a>.</p>
        </footer>
    )

}

export default Footer;
