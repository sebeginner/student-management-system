interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Man hinh nay da san sang goi API that. Chua them du lieu mau o frontend.
      </div>
    </section>
  );
};
