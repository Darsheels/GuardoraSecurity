export default function ProcessingLoader({ message = "Processing your scan..." }) {
  return (
    <div className="ProcessingLoader" role="status" aria-live="polite">
      <div className="ProcessingLoader-Ring" aria-hidden="true">
        <div className="ProcessingLoader-Core" />
      </div>
      <div className="ProcessingLoader-Text">
        <p className="ProcessingLoader-Title">Processing</p>
        <p className="ProcessingLoader-Message">{message}</p>
      </div>
    </div>
  );
}
