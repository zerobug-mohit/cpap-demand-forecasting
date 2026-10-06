export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="mh-title">
          <div className="eyebrow">WJCF · Neonatal CPAP · India</div>
          <h1>CPAP Demand Estimation &amp; Forecasting</h1>
        </div>
        <p className="subtitle">
          This tool estimates how many neonatal CPAP machines the public health system needs across India. It works the
          number out in more than one way: one approach uses health facilities and government (FBNC) guidelines, and
          another uses how many newborns are likely to need breathing support. It covers both demand today and a
          five-year projection.
        </p>
      </div>
    </header>
  )
}
