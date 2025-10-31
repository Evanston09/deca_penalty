function Footer() {
  return (
    <footer className="text-center m-4 text-zinc-200 flex flex-col items-center">
      <p className="text-sm md:text-base">
        Created with ❤️ by&nbsp;
        <a className="hover:underline text-deca-blue" href="https://evankim.me">
         Evan Kim
        </a>
      </p>
      <p className="text-xs text-zinc-400">
        Your event is processed entirely on the client—nothing is uploaded or
        shared! :) See the{" "}
        <a
          href="https://github.com/Evanston09/deca_penalty"
          className="text-deca-blue hover:underline"
        >
          source code
        </a>
        .
      </p>
    </footer>
  );
}

export default Footer;
