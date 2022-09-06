(impl-trait .commission-trait.commission)

(define-public (pay (id uint) (price uint))
  (begin
    (try! (stx-transfer? (/ (* price u25) u1000) tx-sender 'SP1BX0P4MZ5A3A5JCH0E10YNS170QFR2VQ6TT4NRH))
    (try! (stx-transfer? (/ (* price u50) u1000) tx-sender 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR))
    (ok true)
  )
)