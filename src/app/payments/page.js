export default function Payments() {
  return (
    <div>
      <style jsx>{`
        .container { padding: 20px; font-family: Arial, sans-serif; }
        .payment-card { border: 1px solid #ddd; padding: 15px; margin-top: 20px; border-radius: 5px; }
        .btn { background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
        .modal.show { display: flex; }
        .modal-content { background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .form-group { margin-bottom: 20px; }
        .radio-group { margin-bottom: 10px; }
        .radio-label { display: flex; align-items: center; }
        .radio-input { margin-right: 8px; }
        .select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        .button-group { display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 10px; border: 1px solid #ddd; background-color: #f8f9fa; color: #333; border-radius: 4px; cursor: pointer; }
        .btn-save { flex: 1; padding: 10px; border: none; background-color: #28a745; color: white; border-radius: 4px; cursor: pointer; }
        .btn-save:disabled { background-color: #ccc; cursor: not-allowed; }
      `}</style>
      
      <div className="container">
        <h1>Pagamentos</h1>
        <p>Sistema de gestão de pagamentos com opções de juros</p>

        <div className="payment-card">
          <h3>João Silva - Apartamento 101</h3>
          <p>Valor: R$ 1.500,00</p>
          <p>Status: Pendente</p>
          <button className="btn" onClick={() => {
            document.getElementById('paymentModal').classList.add('show');
          }}>
            Marcar como Pago
          </button>
        </div>

        <div id="paymentModal" className="modal">
          <div className="modal-content">
            <h2>Marcar Pagamento como Pago</h2>
            
            <div className="form-group">
              <p><strong>Inquilino:</strong> João Silva</p>
              <p><strong>Valor Original:</strong> R$ 1.500,00</p>
            </div>

            <div className="form-group">
              <h4>Valor a ser Registrado:</h4>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="interest"
                    value="with"
                    defaultChecked
                    className="radio-input"
                  />
                  Valor com multa e juros (R$ 1.650,00)
                </label>
              </div>
              
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="interest"
                    value="without"
                    className="radio-input"
                  />
                  Apenas valor original (R$ 1.500,00)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Forma de Pagamento:
              </label>
              <select id="paymentMethod" className="select">
                <option value="">Selecione a forma de pagamento</option>
                <option value="PIX">PIX</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO">Cartão</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>

            <div className="button-group">
              <button
                className="btn-cancel"
                onClick={() => {
                  document.getElementById('paymentModal').classList.remove('show');
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-save"
                onClick={() => {
                  const method = document.getElementById('paymentMethod').value;
                  const interest = document.querySelector('input[name="interest"]:checked').value;
                  
                  if (!method) {
                    alert('Selecione uma forma de pagamento');
                    return;
                  }
                  
                  alert(`Pagamento salvo!\\nMétodo: ${method}\\nCom juros: ${interest === 'with' ? 'Sim' : 'Não'}`);
                  document.getElementById('paymentModal').classList.remove('show');
                }}
              >
                Marcar como Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}