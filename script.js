// Definindo a função jspdf para uso posterior
window.jspdf = window.jspdf || {};

document.addEventListener('DOMContentLoaded', function() {
    // Formatação de valores monetários
    function formatMoney(value) {
      return parseFloat(value).toFixed(2).replace('.', ',');
    }
    
    // Formatação de data DD/MM/YYYY
    function formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    }
    
    // Função para obter o nome do item (do select ou input personalizado)
    function getItemName(row, isProduct) {
      const selectClass = isProduct ? '.produto-select' : '.servico-select';
      const customClass = isProduct ? '.produto-custom' : '.servico-custom';
      
      const select = row.querySelector(selectClass);
      const custom = row.querySelector(customClass);
      
      if (!select) return row.cells[1].querySelector('input')?.value || '';
      
      if (select.value === 'outro' && custom && custom.value) {
        return custom.value;
      } else if (select.value && select.value !== 'outro') {
        return select.value;
      } else if (custom && custom.style.display !== 'none' && custom.value) {
        return custom.value;
      } else {
        return '';
      }
    }

    // Configurar comportamento de selects e campos personalizados
    function setupSelectCustomToggle() {
      document.querySelectorAll('.produto-select, .servico-select').forEach(select => {
        if (!select) return;
        
        // Determina se é produto ou serviço
        const isProduct = select.classList.contains('produto-select');
        const customClass = isProduct ? '.produto-custom' : '.servico-custom';
        const customInput = select.parentElement.querySelector(customClass);
        
        if (!customInput) return;
        
        // Quando selecionar uma opção no dropdown
        select.addEventListener('change', function() {
          if (this.value === 'outro') {
            customInput.style.display = 'block';
            customInput.value = '';
            customInput.focus();
          } else if (this.value === '') {
            customInput.style.display = 'none';
            customInput.value = '';
          } else {
            customInput.style.display = 'none';
            customInput.value = this.value;
          }
        });
        
        // Inicializar o estado do input personalizado
        if (select.value === 'outro') {
          customInput.style.display = 'block';
        } else {
          customInput.style.display = 'none';
          if (select.value) {
            customInput.value = select.value;
          }
        }
      });
    }
    
    setupSelectCustomToggle();
    
    function calcularSubtotalProdutos() {
      let total = 0;
      document.querySelectorAll('#produtos-table .item-row').forEach((row, index) => {
        const qtd = parseFloat(row.querySelector('.qtd-produto').value) || 0;
        const valorUnit = parseFloat(row.querySelector('.valor-unit-produto').value) || 0;
        const subtotal = qtd * valorUnit;
        row.querySelector('.subtotal-produto').textContent = subtotal.toFixed(2);
        row.cells[0].textContent = index + 1; // Atualiza o número do item
        total += subtotal;
      });
      document.getElementById('total-produtos').textContent = total.toFixed(2);
      document.getElementById('total-geral-produtos').textContent = total.toFixed(2);
      calcularTotal();
      return total;
    }
    
    function calcularSubtotalServicos() {
      let total = 0;
      document.querySelectorAll('#servicos-table .item-row').forEach((row, index) => {
        const qtd = parseFloat(row.querySelector('.qtd-servico').value) || 0;
        const valorUnit = parseFloat(row.querySelector('.valor-unit-servico').value) || 0;
        const subtotal = qtd * valorUnit;
        row.querySelector('.subtotal-servico').textContent = subtotal.toFixed(2);
        row.cells[0].textContent = index + 1;
        total += subtotal;
      });
      document.getElementById('total-servicos').textContent = total.toFixed(2);
      document.getElementById('total-geral-servicos').textContent = total.toFixed(2);
      calcularTotal();
      return total;
    }

    // Calcular total geral
    function calcularTotal() {
      const totalProdutos = parseFloat(document.getElementById('total-geral-produtos').textContent) || 0;
      const totalServicos = parseFloat(document.getElementById('total-geral-servicos').textContent) || 0;
      const total = totalProdutos + totalServicos;
      document.getElementById('total-geral').textContent = total.toFixed(2);
      // Atualiza o valor do pagamento se houver só uma linha
      const pagamentoRows = document.querySelectorAll('#pagamento-table .item-row');
      if (pagamentoRows.length === 1) {
        pagamentoRows[0].querySelector('.valor-pagamento').value = total.toFixed(2);
      }
    }

    // Atualiza preview com os dados do formulário
    function atualizarPreview() {
      // Data
      document.getElementById('preview-data').textContent = formatDate(document.getElementById('data').value);
      document.getElementById('preview-previsao-entrega').textContent = formatDate(document.getElementById('previsao-entrega').value);
      
      // Cliente
      document.getElementById('preview-cliente').textContent = document.getElementById('cliente').value;
      document.getElementById('preview-cpf-cnpj').textContent = document.getElementById('cpf-cnpj').value;
      document.getElementById('preview-endereco-cliente').textContent = document.getElementById('endereco-cliente').value;
      document.getElementById('preview-cep').textContent = document.getElementById('cep').value;
      document.getElementById('preview-cidade').textContent = document.getElementById('cidade').value;
      document.getElementById('preview-estado').textContent = document.getElementById('estado').value;
      document.getElementById('preview-telefone-cliente').textContent = document.getElementById('telefone-cliente').value;
      document.getElementById('preview-email-cliente').textContent = document.getElementById('email-cliente').value;

      // Produtos
      const produtosBody = document.getElementById('preview-produtos-body');
      produtosBody.innerHTML = '';
      let totalProdutos = 0;
      document.querySelectorAll('#produtos-table .item-row').forEach((row, idx) => {
        const nomeProduto = getItemName(row, true);
        if (!nomeProduto) return; // Pular itens sem nome
        
        const qtd = parseFloat(row.querySelector('.qtd-produto').value) || 0;
        const valorUnit = parseFloat(row.querySelector('.valor-unit-produto').value) || 0;
        const ncm = row.cells[2].querySelector('input').value || '';
        const unidade = row.cells[3].querySelector('input').value || '';
        const subtotal = qtd * valorUnit;
        totalProdutos += subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${nomeProduto}</td>
          <td>${ncm}</td>
          <td>${unidade}</td>
          <td>${qtd.toFixed(2)}</td>
          <td>R$ ${formatMoney(valorUnit)}</td>
        `;
        produtosBody.appendChild(tr);
      });
      document.getElementById('preview-total-produtos').textContent = 'R$ ' + formatMoney(totalProdutos);
      document.getElementById('preview-total-geral-produtos').textContent = formatMoney(totalProdutos);

      // Serviços
      const servicosBody = document.getElementById('preview-servicos-body');
      servicosBody.innerHTML = '';
      let totalServicos = 0;
      document.querySelectorAll('#servicos-table .item-row').forEach((row, idx) => {
        const nomeServico = getItemName(row, false);
        if (!nomeServico) return; // Pular serviços sem nome
        
        const qtd = parseFloat(row.querySelector('.qtd-servico').value) || 0;
        const valorUnit = parseFloat(row.querySelector('.valor-unit-servico').value) || 0;
        const subtotal = qtd * valorUnit;
        totalServicos += subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${nomeServico}</td>
          <td>${qtd.toFixed(2)}</td>
          <td>R$ ${formatMoney(valorUnit)}</td>
        `;
        servicosBody.appendChild(tr);
      });
      document.getElementById('preview-total-servicos').textContent = 'R$ ' + formatMoney(totalServicos);
      document.getElementById('preview-total-geral-servicos').textContent = formatMoney(totalServicos);

      // Totais
      const totalGeral = totalProdutos + totalServicos;
      document.getElementById('preview-total-geral').textContent = formatMoney(totalGeral);

      // Pagamento
      const pagamentoBody = document.getElementById('preview-pagamento-body');
      pagamentoBody.innerHTML = '';
      document.querySelectorAll('#pagamento-table .item-row').forEach(row => {
        const venc = row.cells[0].querySelector('input').value;
        if (!venc) return; // Pular pagamentos sem data
        
        const valor = row.cells[1].querySelector('input').value;
        const forma = row.cells[2].querySelector('select').value;
        const obs = row.cells[3].querySelector('input').value;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatDate(venc)}</td>
          <td>R$ ${formatMoney(valor)}</td>
          <td>${forma}</td>
          <td>${obs}</td>
        `;
        pagamentoBody.appendChild(tr);
      });
    }

    // Criar HTML estruturado para os selects de produtos
    function createProdutoSelectHtml() {
      return `
        <select class="produto-select">
          <option value="">Selecione um produto</option>
          <option value="RESINA">RESINA</option>
          <option value="CATALISADOR">CATALISADOR</option>
          <option value="ACETONA">ACETONA</option>
          <option value="ESTOPA">ESTOPA</option>
          <option value="PINCEL">PINCEL</option>
          <option value="ROLO DE LÃ">ROLO DE LÃ</option>
          <option value="GEL COAT NPG">GEL COAT NPG</option>
          <option value="MANTA FIBRA VIDRO">MANTA FIBRA VIDRO</option>
          <option value="FITA CREPE">FITA CREPE</option>
          <option value="LIXA">LIXA</option>
          <option value="TALCO">TALCO</option>
          <option value="PROPILENO">PROPILENO</option>
          <option value="PASTILHA">PASTILHA</option>
          <option value="REJUNTE ARGAMASSA">REJUNTE ARGAMASSA</option>
          <option value="LED RGB INOX">LED RGB INOX</option>
          <option value="CAIXA DE PASSAGEM">CAIXA DE PASSAGEM</option>
          <option value="CABO PP 4 VIAS 0,5MM">CABO PP 4 VIAS 0,5MM</option>
          <option value="CENTRAL AUTOMAÇÃO + FONTE">CENTRAL AUTOMAÇÃO + FONTE</option>
          <option value="DISPOSITIVOS EM INOX">DISPOSITIVOS EM INOX</option>
          <option value="outro">Outro (personalizado)</option>
        </select>
        <input type="text" class="produto-custom" placeholder="Digite o produto" style="display: none;">
      `;
    }

    // Criar HTML estruturado para os selects de serviços
    function createServicoSelectHtml() {
      return `
        <select class="servico-select">
          <option value="">Selecione um serviço</option>
          <option value="PREPARAÇÃO DA ESTRUTURA">PREPARAÇÃO DA ESTRUTURA</option>
          <option value="FIBRAGEM">FIBRAGEM</option>
          <option value="APLICAÇÃO DA AREIA">APLICAÇÃO DA AREIA</option>
          <option value="APLICAÇÃO DA PASTILHA">APLICAÇÃO DA PASTILHA</option>
          <option value="PINTURA EM GEL">PINTURA EM GEL</option>
          <option value="REMOÇÃO E NIVELAMENTO DA BORDA">REMOÇÃO E NIVELAMENTO DA BORDA</option>
          <option value="SUBSTITUIÇÃO DE DISPOSITIVO">SUBSTITUIÇÃO DE DISPOSITIVO</option>
          <option value="HIDRÁULICA">HIDRÁULICA</option>
          <option value="SUBSTITUIÇÃO DOS LEDS EM INOX">SUBSTITUIÇÃO DOS LEDS EM INOX</option>
          <option value="FECHAMENTO DO SKIMMER">FECHAMENTO DO SKIMMER</option>
          <option value="CONSTRUÇÃO DO DEGRAU">CONSTRUÇÃO DO DEGRAU</option>
          <option value="outro">Outro (personalizado)</option>
        </select>
        <input type="text" class="servico-custom" placeholder="Digite o serviço" style="display: none;">
      `;
    }

    // Adicionar/remover linhas produtos/serviços/pagamento
    function addProdutoRow() {
      const table = document.getElementById('produtos-table').querySelector('tbody');
      const rowCount = table.rows.length;
      const tr = document.createElement('tr');
      tr.className = 'item-row';
      tr.innerHTML = `
        <td>${rowCount + 1}</td>
        <td>${createProdutoSelectHtml()}</td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="number" class="qtd-produto" value="1.00" step="0.01"></td>
        <td><input type="number" class="valor-unit-produto" value="0.00" step="0.01"></td>
        <td class="subtotal-produto">0.00</td>
        <td><button type="button" class="delete-row-btn">X</button></td>
      `;
      table.appendChild(tr);
      bindRowEvents(tr, 'produto');
      setupSelectCustomToggle(); // Configurar os novos selects
    }

    function addServicoRow() {
      const table = document.getElementById('servicos-table').querySelector('tbody');
      const rowCount = table.rows.length;
      const tr = document.createElement('tr');
      tr.className = 'item-row';
      tr.innerHTML = `
        <td>${rowCount + 1}</td>
        <td>${createServicoSelectHtml()}</td>
        <td><input type="number" class="qtd-servico" value="1.00" step="0.01"></td>
        <td><input type="number" class="valor-unit-servico" value="0.00" step="0.01"></td>
        <td class="subtotal-servico">0.00</td>
        <td><button type="button" class="delete-row-btn">X</button></td>
      `;
      table.appendChild(tr);
      bindRowEvents(tr, 'servico');
      setupSelectCustomToggle(); // Configurar os novos selects
    }

    function addPagamentoRow() {
      const table = document.getElementById('pagamento-table').querySelector('tbody');
      const tr = document.createElement('tr');
      tr.className = 'item-row';
      tr.innerHTML = `
        <td><input type="date"></td>
        <td><input type="number" class="valor-pagamento" value="0.00" step="0.01"></td>
        <td>
          <select>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Pix">Pix</option>
            <option value="Transferência">Transferência</option>
            <option value="Boleto">Boleto</option>
          </select>
        </td>
        <td><input type="text"></td>
        <td><button type="button" class="delete-row-btn">X</button></td>
      `;
      table.appendChild(tr);
      bindRowEvents(tr, 'pagamento');
    }

    // Eventos para linhas dinâmicas
    function bindRowEvents(tr, tipo) {
      if (tipo === 'produto') {
        tr.querySelector('.qtd-produto').addEventListener('input', calcularSubtotalProdutos);
        tr.querySelector('.valor-unit-produto').addEventListener('input', calcularSubtotalProdutos);
        
        // Para os novos selects de produtos
        const produtoSelect = tr.querySelector('.produto-select');
        if (produtoSelect) {
          produtoSelect.addEventListener('change', function() {
            atualizarPreview();
          });
        }
        
        const produtoCustom = tr.querySelector('.produto-custom');
        if (produtoCustom) {
          produtoCustom.addEventListener('input', function() {
            atualizarPreview();
          });
        }
      }
      
      if (tipo === 'servico') {
        tr.querySelector('.qtd-servico').addEventListener('input', calcularSubtotalServicos);
        tr.querySelector('.valor-unit-servico').addEventListener('input', calcularSubtotalServicos);
        
        // Para os novos selects de serviços
        const servicoSelect = tr.querySelector('.servico-select');
        if (servicoSelect) {
          servicoSelect.addEventListener('change', function() {
            atualizarPreview();
          });
        }
        
        const servicoCustom = tr.querySelector('.servico-custom');
        if (servicoCustom) {
          servicoCustom.addEventListener('input', function() {
            atualizarPreview();
          });
        }
      }
      
      tr.querySelector('.delete-row-btn').addEventListener('click', function () {
        const table = tr.closest('table');
        tr.remove();
        
        // Renumerar linhas
        const tbody = table.querySelector('tbody');
        Array.from(tbody.rows).forEach((row, index) => {
          row.cells[0].textContent = index + 1;
        });
        
        if (tipo === 'produto') calcularSubtotalProdutos();
        if (tipo === 'servico') calcularSubtotalServicos();
        atualizarPreview();
      });
      
      if (tipo === 'pagamento') {
        tr.querySelector('.valor-pagamento').addEventListener('input', atualizarPreview);
        tr.querySelector('select').addEventListener('change', atualizarPreview);
        tr.querySelector('input[type="date"]').addEventListener('input', atualizarPreview);
        tr.querySelector('input[type="text"]').addEventListener('input', atualizarPreview);
      }
    }

    // Tornar as tabelas responsivas em dispositivos móveis
    function makeTablesResponsive() {
      if (window.innerWidth <= 480) {
        document.querySelectorAll('#produtos-table, #servicos-table, #pagamento-table').forEach(table => {
          table.classList.add('table-responsive-stack');
          
          // Adicionar data-label em cada célula baseado no cabeçalho
          const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
          
          table.querySelectorAll('tbody tr').forEach(row => {
            Array.from(row.cells).forEach((cell, index) => {
              if (index > 0 && headers[index]) { // Ignorar a primeira coluna (item #)
                cell.setAttribute('data-label', headers[index]);
              }
            });
          });
        });
      } else {
        document.querySelectorAll('#produtos-table, #servicos-table, #pagamento-table').forEach(table => {
          table.classList.remove('table-responsive-stack');
        });
      }
    }

    // Converter as linhas de produto existentes para usar selects
    function updateExistingProductRows() {
      document.querySelectorAll('#produtos-table tbody tr').forEach(row => {
        // Verificar se já tem o select (para evitar duplicação)
        if (row.querySelector('.produto-select')) return;
        
        const inputCell = row.cells[1];
        const oldValue = inputCell.querySelector('input')?.value || '';
        
        // Substituir o input pelo select + input personalizado
        inputCell.innerHTML = createProdutoSelectHtml();
        
        // Se tinha um valor anterior, tentar encontrar no select ou definir como personalizado
        if (oldValue) {
          const select = inputCell.querySelector('.produto-select');
          const custom = inputCell.querySelector('.produto-custom');
          
          // Verificar se o valor está nas opções do select
          let foundInOptions = false;
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === oldValue) {
              select.selectedIndex = i;
              foundInOptions = true;
              
              // Esconder o campo personalizado e definir seu valor
              custom.style.display = 'none';
              custom.value = oldValue;
              break;
            }
          }
          
          // Se não encontrou nas opções, definir como personalizado
          if (!foundInOptions && oldValue) {
            select.value = 'outro';
            custom.style.display = 'block';
            custom.value = oldValue;
          }
        }
      });
      
      // Adicionar event listeners para os novos selects
      setupSelectCustomToggle();
    }

    // Converter as linhas de serviço existentes para usar selects
    function updateExistingServiceRows() {
      document.querySelectorAll('#servicos-table tbody tr').forEach(row => {
        // Verificar se já tem o select (para evitar duplicação)
        if (row.querySelector('.servico-select')) return;
        
        const inputCell = row.cells[1];
        const oldValue = inputCell.querySelector('input')?.value || '';
        
        // Substituir o input pelo select + input personalizado
        inputCell.innerHTML = createServicoSelectHtml();
        
        // Se tinha um valor anterior, tentar encontrar no select ou definir como personalizado
        if (oldValue) {
          const select = inputCell.querySelector('.servico-select');
          const custom = inputCell.querySelector('.servico-custom');
          
          // Verificar se o valor está nas opções do select
          let foundInOptions = false;
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === oldValue) {
              select.selectedIndex = i;
              foundInOptions = true;
              
              // Esconder o campo personalizado e definir seu valor
              custom.style.display = 'none';
              custom.value = oldValue;
              break;
            }
          }
          
          // Se não encontrou nas opções, definir como personalizado
          if (!foundInOptions && oldValue) {
            select.value = 'outro';
            custom.style.display = 'block';
            custom.value = oldValue;
          }
        }
      });
      
      // Adicionar event listeners para os novos selects
      setupSelectCustomToggle();
    }

    // Atualizar linhas existentes para usar selects
    updateExistingProductRows();
    updateExistingServiceRows();
    
    // Configurar eventos iniciais
    document.querySelectorAll('.qtd-produto, .valor-unit-produto').forEach(input => {
      input.addEventListener('input', calcularSubtotalProdutos);
    });
    document.querySelectorAll('.qtd-servico, .valor-unit-servico').forEach(input => {
      input.addEventListener('input', calcularSubtotalServicos);
    });
    document.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const tr = btn.closest('tr');
        const table = tr.closest('table');
        tr.remove();
        
        // Renumerar linhas
        const tbody = table.querySelector('tbody');
        Array.from(tbody.rows).forEach((row, index) => {
          row.cells[0].textContent = index + 1;
        });
        
        if (table.id === 'produtos-table') calcularSubtotalProdutos();
        if (table.id === 'servicos-table') calcularSubtotalServicos();
        atualizarPreview();
      });
    });

    // Adicionar eventos aos botões
    document.getElementById('add-produto').addEventListener('click', addProdutoRow);
    document.getElementById('add-servico').addEventListener('click', addServicoRow);
    document.getElementById('add-pagamento').addEventListener('click', addPagamentoRow);

    // Atualizar preview ao clicar no botão
    document.getElementById('visualizar-btn').addEventListener('click', function () {
      atualizarPreview();
      document.getElementById('preview-container').style.display = 'block';
      window.scrollTo({ top: document.getElementById('preview-container').offsetTop, behavior: 'smooth' });
    });

    // Atualizar preview ao editar campos principais
    document.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', atualizarPreview);
    });
    
    // Fechar preview ao clicar fora dele
    document.getElementById('preview-container').addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });

    // Configurar data atual para o campo de data
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = today;

    // Inicialização
    calcularSubtotalProdutos();
    calcularSubtotalServicos();
    atualizarPreview();
    makeTablesResponsive();
    
    // Chamar responsividade quando a janela for redimensionada
    window.addEventListener('resize', makeTablesResponsive);

    // Função para gerar PDF do preview
    document.getElementById('gerar-pdf-btn').addEventListener('click', function () {
      atualizarPreview();
      
      // Mostrar área de preview (isso é importante para o html2canvas funcionar)
      const previewContainer = document.getElementById('preview-container');
      previewContainer.style.display = 'block';
      const previewContent = document.getElementById('preview-content');
      
      // Capturamos o tamanho inicial da tela
      const originalWidth = window.innerWidth;
      
      // Forçamos uma largura desktop para o momento da captura
      const tempStyle = document.createElement('style');
      tempStyle.innerHTML = `
        @media print {
          body { width: 1024px !important; }
          #preview-content { width: 800px !important; margin: 0 auto !important; }
        }
      `;
      document.head.appendChild(tempStyle);
      
      // Criamos um clone do conteúdo para manipular sem afetar a visualização
      const cloneForPDF = previewContent.cloneNode(true);
      cloneForPDF.style.width = '800px';
      cloneForPDF.style.margin = '0 auto';
      cloneForPDF.style.padding = '20px';
      cloneForPDF.style.backgroundColor = '#fff';
      cloneForPDF.style.boxShadow = 'none';
      
      // Criamos um container temporário fora da tela
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px'; // Largura fixa para desktop
      tempContainer.appendChild(cloneForPDF);
      document.body.appendChild(tempContainer);
      
      // Delay para garantir que o DOM esteja atualizado
      setTimeout(() => {
        html2canvas(cloneForPDF, { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800, // Forçar largura desktop
        }).then(canvas => {
          // Remover elementos temporários
          document.body.removeChild(tempContainer);
          document.head.removeChild(tempStyle);
          
          // Continuar com o processo de PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          // Ajustes para garantir que a imagem caiba na página A4
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          // Centralizar na página
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          let imgY = 5; // margem superior
          
          // Se a imagem for muito alta, divida em várias páginas
          const pageHeight = pdfHeight - 10; // margem de 5mm em cima e embaixo
          let remainingHeight = imgHeight;
          let position = 0;
          
          while (remainingHeight > 0) {
            // Adicionar uma página se necessário (exceto a primeira)
            if (position > 0) {
              pdf.addPage();
            }
            
            // Altura a ser capturada nesta página
            const heightOnThisPage = Math.min(remainingHeight, pageHeight / ratio);
            
            // Recortar e adicionar a parte da imagem
            pdf.addImage(
              imgData, 
              'JPEG', 
              imgX, 
              imgY - (position * pageHeight / ratio), // posição vertical ajustada
              imgWidth * ratio, 
              imgHeight * ratio, // altura total da imagem
              null, 
              'FAST',
              0 // rotação
            );
            
            // Atualizar altura restante e posição
            remainingHeight -= heightOnThisPage;
            position++;
          }
          
          pdf.save('orcamento-cav.pdf');
          
          // Restaurar visibilidade do preview para o usuário
          if (originalWidth <= 480) {
            makeTablesResponsive(); // reaplica estilos móveis se necessário
          }
        });
      }, 500);
    });
    
    console.log('JavaScript iniciado com sucesso!');
});
