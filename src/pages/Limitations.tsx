import imageExample from "../assets/image.png";
import realTextExample from "../assets/real_text.png";

function Limitations() {
  return (
    <>
      <h1 className="text-2xl md:text-5xl font-semibold mb-6">Why Results May Vary</h1>

      <div className="w-full max-w-4xl space-y-6">
        <div className="p-6 rounded-xl border space-y-4">
          <h2 className="text-xl font-semibold">The Challenge of PDF Parsing</h2>
          <p className="text-gray-300">
            Parsing PDFs is <span className="font-bold text-white">incredibly difficult</span>.
            PDFs weren't designed to be parsed. They're essentially just a set of drawing instructions for rendering content on a page.
            There's no inherent structure or order, making it challenging to extract text accurately.
          </p>
          <p className="text-gray-300">
            With minimal standardization across PDF creation tools and varying formatting choices,
            achieving perfect accuracy is nearly impossible without advanced processing.
          </p>
        </div>

        <div className="p-6 rounded-xl border space-y-4">
          <h2 className="text-xl font-semibold">The Biggest Culprit: Images as Text</h2>
          <p className="text-gray-300">
            The most common cause of parsing errors is when text is embedded as images rather than actual text.
            This is particularly common in DECA submissions (no offense!).
          </p>
          <p className="text-gray-300">
            <span className="font-semibold text-white">Quick test:</span> Try highlighting the text in your PDF viewer.
            If you can't select it, it's an image, and the parser won't be able to read it.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <img
                src={imageExample}
                alt="Example of image-based text"
                className="w-full rounded-lg"
              />
              <p className="text-sm text-red-400 text-center">Image-based text (Not parseable)</p>
            </div>
            <div className="space-y-2">
              <img
                src={realTextExample}
                alt="Example of real text"
                className="w-full rounded-lg"
              />
              <p className="text-sm text-green-400 text-center">Real text (Parseable)</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border space-y-4">
          <h2 className="text-xl font-semibold">Why Not Use OCR or AI?</h2>
          <p className="text-gray-300">
            Modern OCR tools or LLMs could solve many of these issues. However, I wanted to create a service that runs
            <span className="font-semibold text-white"> entirely locally</span> without relying on cloud services. This prioritizes
            your privacy and keeps the tool free and accessible.
          </p>
          <p className="text-gray-300">
            As a completely open-source project, I currently don't have the infrastructure or funding to support
            cloud-based AI processing for everyone.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-deca-blue/30 bg-deca-blue/5 space-y-4">
          <h2 className="text-xl font-semibold">Want to Help?</h2>
          <p className="text-gray-300">
            If you find this tool useful and would like to support enhanced features (like AI-powered parsing),
            consider contributing to help cover infrastructure costs. No pressure though. This is likely a one-off project,
            but I can always hope for more!
          </p>
          <div className="space-y-3 mt-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-300">Bitcoin (BTC)</p>
              <code className="block text-xs bg-black/30 p-2 rounded border border-gray-700">
                bc1qqssr9fxhq9hpt9fxlwl83amnhj70q5usm7he94
              </code>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-300">Ethereum (ETH)</p>
              <code className="block text-xs bg-black/30 p-2 rounded border border-gray-700">
                0x49cBa07F9dD81fEbbc82Aa5315Ec1E856dce1A64
              </code>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-300">Monero (XMR)</p>
              <code className="block text-xs bg-black/30 p-2 rounded border border-gray-700">
                49pHFQ2C1hwM8YLk9JQ6WCKbpvhTdSCUjEsM8h3Ti7k2EBKXrQ957U5XcA28uA71boYbFE9kA9kNicoJx7d7Que95Eubh9c
              </code>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Limitations;
