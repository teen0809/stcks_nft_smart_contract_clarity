(impl-trait .commission-trait.commission)

(define-public (pay (id uint) (price uint))
  (begin
    (try! (stx-transfer? (/ (* price u25) u1000) tx-sender 'SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S))
    (try! (stx-transfer? (/ (* price u50) u1000) tx-sender 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR))
    (ok true)
  )
)