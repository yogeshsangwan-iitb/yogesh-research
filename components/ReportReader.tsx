type ReportReaderProps = {
  title: string;
  pdf: string;
  docx?: string;
  pages?: number;
};

/**
 * Side panel with the full report. On large screens the PDF is readable right here;
 * on phones (where embedded PDFs scroll badly) it opens in the phone's own PDF viewer.
 */
export default function ReportReader({ title, pdf, docx, pages }: ReportReaderProps) {
  return (
    <div className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-[10px] border border-ink/80 bg-paper">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-4">
          <h2 className="font-semibold">Full report</h2>
          <p className="tabular text-sm text-stone">{pages ? `${pages} pages, PDF` : "PDF"}</p>
        </div>

        <div className="hidden bg-paper-deep lg:block">
          <iframe
            src={`${pdf}#view=FitH`}
            title={`Full report: ${title}`}
            loading="lazy"
            className="block h-[calc(100vh-15rem)] min-h-[28rem] w-full"
          />
        </div>

        <div className="flex flex-col gap-2 p-4 sm:flex-row lg:flex-col xl:flex-row">
          <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn btn-rust flex-1">
            <span className="lg:hidden">Read the full report</span>
            <span className="hidden lg:inline">Open full screen</span>
          </a>
          {docx && (
            <a href={docx} download className="btn btn-line flex-1">
              Download Word file
            </a>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-stone">
        The summary on this page covers the essentials. The full report has the complete analysis, tables and sources.
      </p>
    </div>
  );
}
