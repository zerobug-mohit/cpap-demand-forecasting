export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="eyebrow">WJCF · Neonatal CPAP · India</div>
        <h1>CPAP Demand Estimation &amp; Forecasting</h1>
        <p className="subtitle">
          This tool estimates how many neonatal CPAP machines the public health system needs across India. It works the
          number out in more than one way: one approach uses the number of health facilities and government (FBNC)
          guidelines, and another uses how many newborns are likely to need breathing support. It shows both the demand
          today and a projection for the next five years.
        </p>
      </div>
    </header>
  )
}
