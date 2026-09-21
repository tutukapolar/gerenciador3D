import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Calculator, 
  Package, 
  ShoppingCart, 
  ListOrdered, 
  Trash2, 
  Plus, 
  Box,
  TrendingUp,
  Clock,
  DollarSign,
  Link as LinkIcon,
  Phone,
  MapPin,
  Truck,
  PieChart,
  TrendingDown,
  Layers,
  AlertTriangle,
  Megaphone,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  LogOut,
  Shield,
  UserPlus
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  // Estados de Autenticação / Convite
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [accessCodes, setAccessCodes] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');

  // --- ESTOQUE DE FILAMENTOS ---
  const [filamentos, setFilamentos] = useState([]);
  const [novoFilamento, setNovoFilamento] = useState({ nome: '', marca: '', cor: '', tipo: 'PLA', precoKg: '', pesoTotalG: '1000' });

  // --- CALCULADORA ---
  const [linkMakerworld, setLinkMakerworld] = useState('');
  const [filamentosProjeto, setFilamentosProjeto] = useState([
    { idTemp: Date.now(), filamentoId: '', pesoGramas: '' }
  ]);

  const [calcData, setCalcData] = useState({
    nomeItem: '',
    tempoHoras: '',
    quantidadePecas: '1',
    margemErroPct: '5',
    custoEnergiaKwh: '0.90',
    potenciaImpressoraW: '200',
    custoMaoDeObra: '10.00',
    custoEmbalagem: '3.50',
    lucroDesejadoPct: '100'
  });
  const [resultadoCalculo, setResultadoCalculo] = useState(null);

  // --- PRODUTOS E ENCOMENDAS ---
  const [produtos, setProdutos] = useState([]);
  const [encomendas, setEncomendas] = useState([]);
  const [novaEncomenda, setNovaEncomenda] = useState({
    cliente: '',
    contato: '',
    endereco: '',
    produtoId: '',
    produtoNome: '',
    quantidade: 1,
    valorProduto: '',
    custoUnitario: '0',
    taxaEntrega: '',
    status: 'Pendente'
  });

  // --- ESTADO DA ABA ANÚNCIOS ---
  const [produtoAnuncioId, setProdutoAnuncioId] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) carregarDados(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) carregarDados(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const carregarDados = async (userId) => {
    try {
      const { data: filData } = await supabase.from('estoque_filamentos').select('*').eq('user_id', userId);
      if (filData) setFilamentos(filData);

      const { data: prodData } = await supabase.from('produtos').select('*').eq('user_id', userId);
      if (prodData) setProdutos(prodData);

      const { data: encData } = await supabase.from('encomendas').select('*').eq('user_id', userId);
      if (encData) setEncomendas(encData);

      const { data: codeData } = await supabase.from('access_codes').select('*');
      if (codeData) setAccessCodes(codeData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (isSignUp) {
      const { data: codeCheck, error: codeErr } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', inviteCode.trim())
        .eq('used', false)
        .single();

      if (codeErr || !codeCheck) {
        setAuthError('Código de convite inválido ou já utilizado!');
        return;
      }

      const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) {
        setAuthError(signUpErr.message);
        return;
      }

      if (authData.user) {
        await supabase.from('access_codes').update({ used: true, used_by: authData.user.id }).eq('id', codeCheck.id);
        
        const novoConviteGerado = '3D-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('access_codes').insert([{ code: novoConviteGerado, used: false }]);

        setAuthSuccess('Conta criada com sucesso! Faça login.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError('E-mail ou senha inválidos.');
    }
  };

  // --- IMPORTAR LINK MAKERWORLD ---
  const importarDadosLink = () => {
    if (!linkMakerworld) return;
    setCalcData(prev => ({
      ...prev,
      nomeItem: prev.nomeItem || 'Modelo Importado 3D',
      tempoHoras: '5.2'
    }));
    if (filamentos.length > 0) {
      setFilamentosProjeto([
        { idTemp: Date.now(), filamentoId: filamentos[0].id.toString(), pesoGramas: '125' }
      ]);
    }
    alert('Dados do modelo extraídos com sucesso do link!');
  };

  // --- FILAMENTOS NO PROJETO ---
  const adicionarFilamentoNoProjeto = () => {
    setFilamentosProjeto([
      ...filamentosProjeto,
      { idTemp: Date.now(), filamentoId: '', pesoGramas: '' }
    ]);
  };

  const removerFilamentoDoProjeto = (idTemp) => {
    if (filamentosProjeto.length === 1) return;
    setFilamentosProjeto(filamentosProjeto.filter(f => f.idTemp !== idTemp));
  };

  const atualizarFilamentoProjeto = (idTemp, campo, valor) => {
    setFilamentosProjeto(filamentosProjeto.map(item => {
      if (item.idTemp === idTemp) {
        return { ...item, [campo]: valor };
      }
      return item;
    }));
  };

  // --- ESTOQUE DE FILAMENTOS (SUPABASE) ---
  const adicionarFilamento = async (e) => {
    e.preventDefault();
    if (!novoFilamento.nome || !novoFilamento.precoKg) return;

    const { data, error } = await supabase.from('estoque_filamentos').insert([{
      user_id: session.user.id,
      nome: novoFilamento.nome,
      marca: novoFilamento.marca || 'Genérica',
      cor: novoFilamento.cor || 'Padrão',
      tipo: novoFilamento.tipo || 'PLA',
      preco_kg: parseFloat(novoFilamento.precoKg),
      peso_atual_g: parseFloat(novoFilamento.pesoTotalG) || 1000
    }]).select();

    if (!error && data) {
      setFilamentos([...filamentos, data[0]]);
      setNovoFilamento({ nome: '', marca: '', cor: '', tipo: 'PLA', precoKg: '', pesoTotalG: '1000' });
    }
  };

  const excluirFilamento = async (id) => {
    await supabase.from('estoque_filamentos').delete().eq('id', id);
    setFilamentos(filamentos.filter(f => f.id !== id));
  };

  // --- CÁLCULO DE PRECIFICACÃO E MARKETPLACES ---
  const calcularPreco = (e) => {
    e.preventDefault();
    
    const tempoH = parseFloat(calcData.tempoHoras) || 0;
    const qtdPecas = parseInt(calcData.quantidadePecas) || 1;
    const pctErro = parseFloat(calcData.margemErroPct) || 0;
    const potenciaW = parseFloat(calcData.potenciaImpressoraW) || 200;
    const kwhPreco = parseFloat(calcData.custoEnergiaKwh) || 0.90;
    const maoDeObra = parseFloat(calcData.custoMaoDeObra) || 0;
    const embalagem = parseFloat(calcData.custoEmbalagem) || 0;
    const margemLucroPct = parseFloat(calcData.lucroDesejadoPct) || 100;

    let custoMaterialBase = 0;
    let pesoTotalGramas = 0;
    const detalhamentoFilamentos = [];

    filamentosProjeto.forEach(fp => {
      const filamentoEncontrado = filamentos.find(f => f.id === fp.filamentoId || f.id === parseInt(fp.filamentoId));
      const pesoG = parseFloat(fp.pesoGramas) || 0;
      const precoKg = filamentoEncontrado ? (filamentoEncontrado.preco_kg || filamentoEncontrado.precoKg) : 120;
      
      const custoParcial = ((pesoG * qtdPecas) / 1000) * precoKg;
      custoMaterialBase += custoParcial;
      pesoTotalGramas += (pesoG * qtdPecas);

      detalhamentoFilamentos.push({
        filamentoId: filamentoEncontrado ? filamentoEncontrado.id : null,
        pesoUnitario: pesoG,
        nome: filamentoEncontrado ? `${filamentoEncontrado.nome} (${filamentoEncontrado.tipo || 'PLA'} - ${filamentoEncontrado.cor})` : 'Filamento Genérico',
        pesoParcial: (pesoG * qtdPecas).toFixed(0),
        custoParcial: custoParcial.toFixed(2)
      });
    });

    const custoEnergiaBase = ((tempoH * qtdPecas) * (potenciaW / 1000)) * kwhPreco;
    const custoAdicionalErro = (custoMaterialBase + custoEnergiaBase) * (pctErro / 100);
    const custoTotalBase = custoMaterialBase + custoEnergiaBase + custoAdicionalErro + maoDeObra + embalagem;

    const valorLucroDesejado = custoTotalBase * (margemLucroPct / 100);
    const precoVendaDireta = custoTotalBase + valorLucroDesejado;

    const calcularPlataforma = (comissaoPct, taxaFixa) => {
      const comissaoDecimal = comissaoPct / 100;
      const precoAnuncio = (custoTotalBase + valorLucroDesejado + taxaFixa) / (1 - comissaoDecimal);
      const valorComissao = precoAnuncio * comissaoDecimal;
      const lucroLiquido = precoAnuncio - valorComissao - taxaFixa - custoTotalBase;
      return {
        precoAnuncio: precoAnuncio.toFixed(2),
        taxaFixa: taxaFixa.toFixed(2),
        comissaoValor: valorComissao.toFixed(2),
        lucroLiquido: lucroLiquido.toFixed(2)
      };
    };

    const shopee = calcularPlataforma(14, 4.00);
    const mercadoLivre = calcularPlataforma(16.5, 6.00);
    const tikTok = calcularPlataforma(12, 3.00);

    setResultadoCalculo({
      qtdPecas,
      pesoTotalG: pesoTotalGramas.toFixed(0),
      tempoTotalH: (tempoH * qtdPecas).toFixed(1),
      detalhamentoFilamentos,
      custoMaterial: custoMaterialBase.toFixed(2),
      custoEnergia: custoEnergiaBase.toFixed(2),
      custoAdicionalErro: custoAdicionalErro.toFixed(2),
      custoMaoDeObra: maoDeObra.toFixed(2),
      custoEmbalagem: embalagem.toFixed(2),
      custoTotalBase: custoTotalBase.toFixed(2),
      precoVendaDireta: precoVendaDireta.toFixed(2),
      shopee,
      mercadoLivre,
      tikTok
    });
  };

  const salvarComoProduto = async () => {
    if (!resultadoCalculo || !calcData.nomeItem) return;
    const nomeProdutoFinal = `${calcData.nomeItem} ${resultadoCalculo.qtdPecas > 1 ? `(Kit ${resultadoCalculo.qtdPecas}x)` : ''}`;
    const precoVendaNum = parseFloat(resultadoCalculo.precoVendaDireta);
    const custoTotalNum = parseFloat(resultadoCalculo.custoTotalBase);
    const tempoHNum = parseFloat(resultadoCalculo.tempoTotalH);

    const { data, error } = await supabase.from('produtos').insert([{
      user_id: session.user.id,
      nome: nomeProdutoFinal,
      preco_sugerido: precoVendaNum,
      custo_total: custoTotalNum,
      tempo_horas: tempoHNum,
      shopee_preco: parseFloat(resultadoCalculo.shopee.precoAnuncio),
      ml_preco: parseFloat(resultadoCalculo.mercadoLivre.precoAnuncio),
      tiktok_preco: parseFloat(resultadoCalculo.tikTok.precoAnuncio),
      peso_g: parseFloat(resultadoCalculo.pesoTotalG),
      filamentos_utilizados: resultadoCalculo.detalhamentoFilamentos // Guardando os filamentos e pesos usados no produto
    }]).select();

    if (!error && data) {
      setProdutos([...produtos, data[0]]);
      alert('Produto salvo com sucesso no catálogo!');
      setAbaAtiva('produtos');
    } else {
      console.error(error);
      alert('Erro ao salvar produto.');
    }
  };

  const excluirProduto = async (id) => {
    await supabase.from('produtos').delete().eq('id', id);
    setProdutos(produtos.filter(p => p.id !== id));
  };

  // --- SELEÇÃO DE PRODUTO NA ENCOMENDA ---
  const aoSelecionarProduto = (e) => {
    const pId = e.target.value;
    if (pId === 'custom') {
      setNovaEncomenda(prev => ({
        ...prev,
        produtoId: 'custom',
        produtoNome: '',
        valorProduto: '',
        custoUnitario: '0'
      }));
    } else {
      const prod = produtos.find(p => p.id === pId || p.id === parseInt(pId));
      if (prod) {
        setNovaEncomenda(prev => ({
          ...prev,
          produtoId: prod.id,
          produtoNome: prod.nome,
          valorProduto: prod.preco_sugerido || prod.preco,
          custoUnitario: prod.custo_total || prod.custo || '0'
        }));
      } else {
        setNovaEncomenda(prev => ({
          ...prev,
          produtoId: '',
          produtoNome: '',
          valorProduto: '',
          custoUnitario: '0'
        }));
      }
    }
  };

  // --- MANIPULAÇÃO DE ENCOMENDAS COM BAIXA AUTOMÁTICA NO ESTOQUE DE FILAMENTO ---
  const adicionarEncomenda = async (e) => {
    e.preventDefault();
    if (!novaEncomenda.cliente || !novaEncomenda.produtoNome) return;

    const qtd = parseInt(novaEncomenda.quantidade) || 1;
    const valProd = parseFloat(novaEncomenda.valorProduto) || 0;
    const custUnit = parseFloat(novaEncomenda.custoUnitario) || 0;
    const taxaEntrega = parseFloat(novaEncomenda.taxaEntrega) || 0;
    const valorTotal = (qtd * valProd) + taxaEntrega;
    const custoTotalEncomenda = qtd * custUnit;

    // Se o produto foi selecionado do catálogo e possui filamentos associados, dá baixa no estoque
    const produtoSelecionado = produtos.find(p => p.id === novaEncomenda.produtoId || p.id === parseInt(novaEncomenda.produtoId));
    
    if (produtoSelecionado && produtoSelecionado.filamentos_utilizados) {
      for (const fUso of produtoSelecionado.filamentos_utilizados) {
        if (fUso.filamentoId) {
          const filamentoEstoque = filamentos.find(f => f.id === fUso.filamentoId);
          if (filamentoEstoque) {
            const pesoGastoTotal = fUso.pesoUnitario * qtd;
            const pesoAtualAtualizado = Math.max(0, (filamentoEstoque.peso_atual_g || 1000) - pesoGastoTotal);

            // Atualiza no Supabase
            await supabase
              .from('estoque_filamentos')
              .update({ peso_atual_g: pesoAtualAtualizado })
              .eq('id', filamentoEstoque.id);

            // Atualiza o estado local do filamento
            setFilamentos(prev => prev.map(f => f.id === filamentoEstoque.id ? { ...f, peso_atual_g: pesoAtualAtualizado } : f));
          }
        }
      }
    }

    const { data, error } = await supabase.from('encomendas').insert([{
      user_id: session.user.id,
      cliente: novaEncomenda.cliente,
      contato: novaEncomenda.contato,
      endereco: novaEncomenda.endereco,
      produto_id: novaEncomenda.produtoId === 'custom' ? null : novaEncomenda.produtoId,
      produto_nome: novaEncomenda.produtoNome,
      quantidade: qtd,
      valor_produto: valProd,
      custo_total_encomenda: custoTotalEncomenda,
      taxa_entrega: taxaEntrega,
      valor_total: valorTotal,
      status: novaEncomenda.status || 'Pendente',
      data: new Date().toLocaleDateString('pt-BR')
    }]).select();

    if (!error && data) {
      setEncomendas([...encomendas, data[0]]);
      setNovaEncomenda({
        cliente: '',
        contato: '',
        endereco: '',
        produtoId: '',
        produtoNome: '',
        quantidade: 1,
        valorProduto: '',
        custoUnitario: '0',
        taxaEntrega: '',
        status: 'Pendente'
      });
      alert('Encomenda registrada e estoque de filamento atualizado com sucesso!');
    } else {
      console.error(error);
      alert('Erro ao salvar encomenda.');
    }
  };

  const excluirEncomenda = async (id) => {
    await supabase.from('encomendas').delete().eq('id', id);
    setEncomendas(encomendas.filter(e => e.id !== id));
  };

  // CÁLCULOS DO DASHBOARD
  const faturamentoTotal = encomendas.reduce((acc, curr) => acc + (parseFloat(curr.valor_total || curr.valorTotal) || 0), 0);
  const custoTotalGastos = encomendas.reduce((acc, curr) => acc + (parseFloat(curr.custo_total_encomenda || curr.custoTotalEncomenda) || 0), 0);
  const lucroLiquidoTotal = faturamentoTotal - custoTotalGastos;
  const margemPercentualGeral = faturamentoTotal > 0 ? ((lucroLiquidoTotal / faturamentoTotal) * 100).toFixed(1) : 0;

  // PRODUTO SELECIONADO NA ABA DE ANÚNCIOS
  const produtoAnuncio = produtos.find(p => p.id === produtoAnuncioId || p.id === parseInt(produtoAnuncioId));

  // GERADOR DA DESCRIÇÃO DO ANÚNCIO
  const gerarTextoAnuncio = (p) => {
    if (!p) return '';
    const pNome = p.nome;
    const pPeso = p.peso_g || p.pesoG || '100';
    return `🔥 ${pNome.toUpperCase()} - IMPRESSÃO 3D PREMIUM 🔥

Procurando qualidade, precisão e um acabamento impecável? Este produto foi fabricado utilizando tecnologia de impressão 3D de alta precisão com material biodegradável e ultra resistente!

✨ DIFERENCIAIS DO NOSSO PRODUTO:
• Produzido com filamento de alta resistência mecânica e durabilidade.
• Design moderno, funcional e com acabamento detalhado.
• Item novo, verificado e testado antes do envio.

📐 ESPECIFICAÇÕES TÉCNICAS:
• Modelo: ${pNome}
• Peso aproximado: ${pPeso}g
• Tecnologia: FDM / Impressão 3D de Alta Precisão
• Conteúdo da Embalagem: 1x ${pNome}

⚠️ CUIDADOS COM O PRODUTO:
- Evitar exposição prolongada a temperaturas superiores a 60°C ou luz solar direta excessiva.
- Para limpeza, utilizar pano levemente umedecido (não utilizar produtos químicos abrasivos).

🚀 ENVIO RÁPIDO E EMBALAGEM SEGURA!
Embalamos o seu produto com todo o carinho e proteção reforçada contra impactos para garantir que chegue perfeito até você!

Dúvidas? Deixe sua pergunta no campo abaixo! Respondemos rapidamente! 😉

#impressao3d #3dprinting #decoracao #setup #organizador #presente3d`;
  };

  const copiarDescricao = () => {
    if (!produtoAnuncio) return;
    navigator.clipboard.writeText(gerarTextoAnuncio(produtoAnuncio));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando sistema...</div>;
  }

  // TELA DE AUTENTICAÇÃO / LOGIN POR CONVITE
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex justify-center mb-6"><Shield className="w-12 h-12 text-indigo-500" /></div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">3D Print Manager</h1>
          <p className="text-slate-400 text-center mb-6 text-sm">Entre ou crie sua conta para gerenciar seu negócio</p>

          {authError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm mb-4">{authError}</div>}
          {authSuccess && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-3 rounded-lg text-sm mb-4">{authSuccess}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Código de Convite *</label>
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required placeholder="Ex: 3D-XXXXXX" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mt-1 uppercase" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mt-1" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium p-3 rounded-lg transition">{isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}</button>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthSuccess(''); }} className="text-sm text-indigo-400 hover:underline">
              {isSignUp ? 'Já tem conta? Faça login' : 'Possui um código de convite? Crie sua conta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* HEADER / BARRA SUPERIOR */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="max-w-6xl mx-auto flex items-center gap-2 cursor-pointer" onClick={() => setAbaAtiva('dashboard')}>
          <Box className="w-7 h-7 text-indigo-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            3D Print Manager
          </h1>
        </div>

        {/* MENU DE NAVEGAÇÃO & SAIR */}
        <div className="flex items-center gap-4">
          <nav className="flex gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'calculadora', label: 'Calculadora', icon: Calculator },
              { id: 'estoque', label: 'Estoque', icon: Package },
              { id: 'produtos', label: 'Produtos', icon: ShoppingCart },
              { id: 'anuncios', label: 'Anúncios', icon: Megaphone },
              { id: 'encomendas', label: 'Encomendas', icon: ListOrdered },
              { id: 'convites', label: 'Convites', icon: UserPlus }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    abaAtiva === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <button onClick={() => supabase.auth.signOut()} className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm transition">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        
        {/* ================= ABA DASHBOARD ================= */}
        {abaAtiva === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" /> Balanço Financeiro Comparativo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Valor Total das Encomendas
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                    R$ {faturamentoTotal.toFixed(2)}
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-rose-400" /> Custos de Insumos & Energia
                  </span>
                  <p className="text-2xl font-extrabold text-rose-400 mt-1">
                    R$ {custoTotalGastos.toFixed(2)}
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> Lucro Líquido Real
                  </span>
                  <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                    R$ {lucroLiquidoTotal.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 ml-2">({margemPercentualGeral}%)</span>
                  </p>
                </div>
              </div>

              {faturamentoTotal > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Custos ({((custoTotalGastos / faturamentoTotal) * 100).toFixed(0)}%)</span>
                    <span>Lucro Líquido ({margemPercentualGeral}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${(custoTotalGastos / faturamentoTotal) * 100}%` }} 
                      className="bg-rose-500 h-full transition-all duration-500" 
                      title="Custo de Produção"
                    />
                    <div 
                      style={{ width: `${(lucroLiquidoTotal / faturamentoTotal) * 100}%` }} 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      title="Lucro Líquido"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" /> Encomendas Recentes
                </h3>
                {encomendas.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma encomenda registrada ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {encomendas.slice(-4).reverse().map(enc => (
                      <div key={enc.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-slate-200">{enc.produto_nome || enc.produtoNome} (x{enc.quantidade})</p>
                          <p className="text-xs text-slate-400">Cliente: {enc.cliente}</p>
                        </div>
                        <span className="text-emerald-400 font-bold">R$ {enc.valor_total || enc.valorTotal}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" /> Estoque de Filamentos
                </h3>
                {filamentos.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum filamento no estoque.</p>
                ) : (
                  <div className="space-y-3">
                    {filamentos.map(f => {
                      const pesoAtual = f.peso_atual_g !== undefined ? f.peso_atual_g : 1000;
                      return (
                        <div key={f.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium text-slate-200">{f.nome} <span className="text-xs text-indigo-400">({f.tipo || 'PLA'})</span></p>
                            <p className="text-xs text-slate-400">Cor: {f.cor} | Restante: <span className="text-emerald-400 font-bold">{pesoAtual}g</span></p>
                          </div>
                          <span className="text-indigo-400 font-medium">R$ {f.preco_kg || f.precoKg}/kg</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA CALCULADORA MULTI-FILAMENTO ================= */}
        {abaAtiva === 'calculadora' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm whitespace-nowrap">
                <LinkIcon className="w-5 h-5" /> MakerWorld / Link 3D:
              </div>
              <input
                type="url"
                placeholder="Cole o link do modelo (ex: MakerWorld, Printables...)"
                value={linkMakerworld}
                onChange={e => setLinkMakerworld(e.target.value)}
                className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={importarDadosLink}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
              >
                Importar Dados
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={calcularPreco} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2">Parâmetros de Impressão</h2>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome do Item / Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Suporte Multicor ou Kit Peças"
                    value={calcData.nomeItem}
                    onChange={e => setCalcData({...calcData, nomeItem: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                      <Package className="w-4 h-4" /> Filamentos do Projeto
                    </label>
                    <button
                      type="button"
                      onClick={adicionarFilamentoNoProjeto}
                      className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 font-medium px-2.5 py-1 rounded-md transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Outro Filamento
                    </button>
                  </div>

                  {filamentosProjeto.map((fp, index) => (
                    <div key={fp.idTemp} className="grid grid-cols-12 gap-2 items-center bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                      <div className="col-span-7">
                        <select
                          required
                          value={fp.filamentoId}
                          onChange={e => atualizarFilamentoProjeto(fp.idTemp, 'filamentoId', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Selecione o Filamento {index + 1}...</option>
                          {filamentos.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.nome} ({f.tipo || 'PLA'} - {f.cor}) - R$ {f.preco_kg || f.precoKg}/kg
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          required
                          placeholder="Peso (g)"
                          value={fp.pesoGramas}
                          onChange={e => atualizarFilamentoProjeto(fp.idTemp, 'pesoGramas', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {filamentosProjeto.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerFilamentoDoProjeto(fp.idTemp)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Remover este filamento"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-indigo-400" /> Quantidade de Peças
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Ex: 1"
                      value={calcData.quantidadePecas}
                      onChange={e => setCalcData({...calcData, quantidadePecas: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Margem de Erro (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ex: 5"
                      value={calcData.margemErroPct}
                      onChange={e => setCalcData({...calcData, margemErroPct: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tempo Unitário (Horas)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ex: 4.5"
                    value={calcData.tempoHoras}
                    onChange={e => setCalcData({...calcData, tempoHoras: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Potência Impressora (Watts)</label>
                    <input
                      type="number"
                      value={calcData.potenciaImpressoraW}
                      onChange={e => setCalcData({...calcData, potenciaImpressoraW: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Custo Energia (R$/kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calcData.custoEnergiaKwh}
                      onChange={e => setCalcData({...calcData, custoEnergiaKwh: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Mão de Obra (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 10.00"
                      value={calcData.custoMaoDeObra}
                      onChange={e => setCalcData({...calcData, custoMaoDeObra: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Embalagem (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 3.50"
                      value={calcData.custoEmbalagem}
                      onChange={e => setCalcData({...calcData, custoEmbalagem: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Margem de Lucro Desejada (%)</label>
                  <input
                    type="number"
                    value={calcData.lucroDesejadoPct}
                    onChange={e => setCalcData({...calcData, lucroDesejadoPct: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition"
                >
                  Calcular Precificação
                </button>
              </form>

              {/* RESULTADO E SIMULAÇÃO DE MARKETPLACES */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2 mb-4">Resumo e Simulador de Marketplaces</h2>
                  
                  {resultadoCalculo ? (
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-xs space-y-2">
                        <p className="font-bold text-slate-300 text-sm mb-2 flex justify-between">
                          <span>Detalhamento dos Custos:</span>
                          <span className="text-indigo-400">{resultadoCalculo.qtdPecas} peça(s) | {resultadoCalculo.pesoTotalG}g total | {resultadoCalculo.tempoTotalH}h</span>
                        </p>

                        <div className="space-y-1 py-1 border-y border-slate-800">
                          <p className="text-slate-400 font-medium">Filamentos Utilizados:</p>
                          {resultadoCalculo.detalhamentoFilamentos.map((df, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300 pl-2">
                              <span>• {df.nome} ({df.pesoParcial}g)</span>
                              <span>R$ {df.custoParcial}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between pt-1"><span>Energia Total:</span><span className="text-slate-200">R$ {resultadoCalculo.custoEnergia}</span></div>
                        <div className="flex justify-between text-amber-400"><span>Margem para Falhas/Erros:</span><span>+ R$ {resultadoCalculo.custoAdicionalErro}</span></div>
                        <div className="flex justify-between"><span>Mão de Obra:</span><span className="text-slate-200">R$ {resultadoCalculo.custoMaoDeObra}</span></div>
                        <div className="flex justify-between"><span>Embalagem:</span><span className="text-slate-200">R$ {resultadoCalculo.custoEmbalagem}</span></div>
                        <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-indigo-400 text-sm">
                          <span>Custo Total de Produção:</span>
                          <span>R$ {resultadoCalculo.custoTotalBase}</span>
                        </div>
                      </div>

                      <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="block text-xs text-emerald-300 font-bold uppercase">Venda Direta / PIX</span>
                          <span className="text-xs text-slate-400">(Preço mínimo recomendável)</span>
                        </div>
                        <span className="text-2xl font-extrabold text-emerald-400">R$ {resultadoCalculo.precoVendaDireta}</span>
                      </div>

                      <div className="space-y-3">
                        <p className="font-bold text-slate-300 text-sm">Preços sugeridos para Anúncios (Comissões inclusas):</p>
                        
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-orange-400 text-sm">Shopee</p>
                            <p className="text-slate-400">Taxa: 14% + R$ 4,00 | Lucro: R$ {resultadoCalculo.shopee.lucroLiquido}</p>
                          </div>
                          <span className="text-lg font-bold text-slate-100">R$ {resultadoCalculo.shopee.precoAnuncio}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-yellow-400 text-sm">Mercado Livre</p>
                            <p className="text-slate-400">Taxa: 16.5% + R$ 6,00 | Lucro: R$ {resultadoCalculo.mercadoLivre.lucroLiquido}</p>
                          </div>
                          <span className="text-lg font-bold text-slate-100">R$ {resultadoCalculo.mercadoLivre.precoAnuncio}</span>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-cyan-400 text-sm">TikTok Shop</p>
                            <p className="text-slate-400">Taxa: 12% + R$ 3,00 | Lucro: R$ {resultadoCalculo.tikTok.lucroLiquido}</p>
                          </div>
                          <span className="text-lg font-bold text-slate-100">R$ {resultadoCalculo.tikTok.precoAnuncio}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500 text-sm">
                      Preencha os dados à esquerda e clique em "Calcular Precificação" para ver as taxas e os preços em cada marketplace.
                    </div>
                  )}
                </div>

                {resultadoCalculo && (
                  <button
                    onClick={salvarComoProduto}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition mt-4"
                  >
                    Salvar Produto no Catálogo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA ESTOQUE (COM PESO DISPONÍVEL) ================= */}
        {abaAtiva === 'estoque' && (
          <div className="space-y-6">
            <form onSubmit={adicionarFilamento} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2">Adicionar Novo Filamento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
                <input
                  type="text"
                  placeholder="Nome (Ex: Preto Premium)"
                  required
                  value={novoFilamento.nome}
                  onChange={e => setNovoFilamento({...novoFilamento, nome: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Marca (Ex: Voolt3D)"
                  value={novoFilamento.marca}
                  onChange={e => setNovoFilamento({...novoFilamento, marca: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <div>
                  <select
                    value={novoFilamento.tipo}
                    onChange={e => setNovoFilamento({...novoFilamento, tipo: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="ASA">ASA</option>
                    <option value="TPU">TPU (Flexível)</option>
                    <option value="Silk">Silk</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Cor (Ex: Vermelho)"
                  value={novoFilamento.cor}
                  onChange={e => setNovoFilamento({...novoFilamento, cor: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço/kg (R$)"
                  required
                  value={novoFilamento.precoKg}
                  onChange={e => setNovoFilamento({...novoFilamento, precoKg: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Peso Inicial (g)"
                  value={novoFilamento.pesoTotalG}
                  onChange={e => setNovoFilamento({...novoFilamento, pesoTotalG: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition md:col-span-6"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Filamento
                </button>
              </div>
            </form>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-lg font-bold text-slate-200 mb-4">Filamentos no Estoque</h2>
              {filamentos.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum filamento cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filamentos.map(f => {
                    const pesoAtual = f.peso_atual_g !== undefined ? f.peso_atual_g : 1000;
                    return (
                      <div key={f.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-200">{f.nome}</h3>
                            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-medium">{f.tipo || 'PLA'}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Marca: {f.marca || 'Genérica'} | Cor: {f.cor} | Preço: <span className="text-emerald-400 font-bold">R$ {f.preco_kg || f.precoKg}/kg</span></p>
                          <p className="text-xs text-indigo-300 mt-1">Peso Disponível: <span className="font-bold text-white">{pesoAtual}g</span></p>
                        </div>
                        <button
                          onClick={() => excluirFilamento(f.id)}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Excluir Filamento"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA PRODUTOS ================= */}
        {abaAtiva === 'produtos' && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Catálogo de Produtos Cadastrados</h2>
            {produtos.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhum produto salvo ainda. Faça um cálculo na aba "Calculadora" e clique em "Salvar Produto".</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {produtos.map(p => (
                  <div key={p.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100">{p.nome}</h3>
                      <div className="text-xs text-slate-400 mt-1 flex justify-between">
                        <span>Custo Base: R$ {p.custo_total || p.custo}</span>
                        <span>Peso: {p.peso_g || p.pesoG || 0}g</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-emerald-400 font-bold text-base">R$ {p.preco_sugerido || p.preco}</span>
                      <button onClick={() => excluirProduto(p.id)} className="text-rose-400 hover:text-rose-300 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ABA GERADOR DE ANÚNCIOS ================= */}
        {abaAtiva === 'anuncios' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Gerador de Anúncios para Marketplaces
              </h2>
              <p className="text-xs text-slate-400">
                Selecione um produto do seu catálogo para gerar o texto da descrição otimizado para SEO, preço ideal com taxas e atalhos rápidos para publicar.
              </p>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Escolha o Produto para Anunciar</label>
                <select
                  value={produtoAnuncioId}
                  onChange={e => setProdutoAnuncioId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Selecione um produto do catálogo...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Venda Direta: R$ {p.preco_sugerido || p.preco})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {produtoAnuncio ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                      <h3 className="font-bold text-slate-200 text-sm">Prévia da Descrição Gerada</h3>
                      <button
                        onClick={copiarDescricao}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiado ? 'Copiado!' : 'Copiar Descrição'}
                      </button>
                    </div>

                    <textarea
                      readOnly
                      rows={14}
                      value={gerarTextoAnuncio(produtoAnuncio)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
                  <h3 className="font-bold text-slate-200 text-sm border-b border-slate-700 pb-2">
                    Preços Recomendados & Atalhos de Publicação
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-orange-400 text-sm block">Shopee</span>
                        <span className="text-xs text-slate-400">Preço do Anúncio Sugerido</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-extrabold text-slate-100">
                          R$ {produtoAnuncio.shopee_preco || produtoAnuncio.shopeePreco || ((parseFloat(produtoAnuncio.preco_sugerido || produtoAnuncio.preco)) * 1.22).toFixed(2)}
                        </span>
                        <a
                          href="https://seller.shopee.com.br/portal/product/list/all"
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 rounded-lg transition"
                          title="Abrir Painel Shopee"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-yellow-400 text-sm block">Mercado Livre</span>
                        <span className="text-xs text-slate-400">Preço do Anúncio Sugerido</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-extrabold text-slate-100">
                          R$ {produtoAnuncio.ml_preco || produtoAnuncio.mlPreco || ((parseFloat(produtoAnuncio.preco_sugerido || produtoAnuncio.preco)) * 1.25).toFixed(2)}
                        </span>
                        <a
                          href="https://www.mercadolivre.com.br/anunciar"
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg transition"
                          title="Abrir Painel Mercado Livre"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-cyan-400 text-sm block">TikTok Shop</span>
                        <span className="text-xs text-slate-400">Preço do Anúncio Sugerido</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-extrabold text-slate-100">
                          R$ {produtoAnuncio.tiktok_preco || produtoAnuncio.tiktokPreco || ((parseFloat(produtoAnuncio.preco_sugerido || produtoAnuncio.preco)) * 1.18).toFixed(2)}
                        </span>
                        <a
                          href="https://seller-br.tiktok.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-lg transition"
                          title="Abrir Painel TikTok Shop"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-lg text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-indigo-300">💡 Como usar:</p>
                    <p>1. Clique no botão <strong>"Copiar Descrição"</strong> acima.</p>
                    <p>2. Clique no ícone de link externo ao lado da plataforma onde quer vender.</p>
                    <p>3. Cole o texto copiado e defina o valor sugerido exatamente como calculado!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center text-slate-500 text-sm">
                Selecione um produto cadastrado no menu acima para ver a prévia e copiar o anúncio pronto.
              </div>
            )}
          </div>
        )}

        {/* ================= ABA ENCOMENDAS (COM BAIXA AUTOMÁTICA) ================= */}
        {abaAtiva === 'encomendas' && (
          <div className="space-y-6">
            <form onSubmit={adicionarEncomenda} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2">Registrar Nova Encomenda</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={novaEncomenda.cliente}
                    onChange={e => setNovaEncomenda({...novaEncomenda, cliente: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Telefone / Meio de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-8888 ou @instagram"
                    value={novaEncomenda.contato}
                    onChange={e => setNovaEncomenda({...novaEncomenda, contato: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Endereço de Entrega</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade..."
                  value={novaEncomenda.endereco}
                  onChange={e => setNovaEncomenda({...novaEncomenda, endereco: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Selecionar Produto Salvo (Baixa automática de filamento)</label>
                  <select
                    value={novaEncomenda.produtoId}
                    onChange={aoSelecionarProduto}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="">Escolha um produto cadastrado...</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (R$ {p.preco_sugerido || p.preco})
                      </option>
                    ))}
                    <option value="custom">+ Outro produto (Digite manualmente)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome da Peça / Produto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vasinho Deco 3D"
                    value={novaEncomenda.produtoNome}
                    onChange={e => setNovaEncomenda({...novaEncomenda, produtoNome: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={novaEncomenda.quantidade}
                    onChange={e => setNovaEncomenda({...novaEncomenda, quantidade: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Unitário Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={novaEncomenda.valorProduto}
                    onChange={e => setNovaEncomenda({...novaEncomenda, valorProduto: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Taxa de Entrega / Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={novaEncomenda.taxaEntrega}
                    onChange={e => setNovaEncomenda({...novaEncomenda, taxaEntrega: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select
                    value={novaEncomenda.status}
                    onChange={e => setNovaEncomenda({...novaEncomenda, status: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Imprimindo">Imprimindo</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                <span className="text-sm font-medium text-slate-300">Total Previsto da Encomenda (com frete):</span>
                <span className="text-xl font-bold text-emerald-400">
                  R$ {(
                    ((parseInt(novaEncomenda.quantidade) || 0) * (parseFloat(novaEncomenda.valorProduto) || 0)) +
                    (parseFloat(novaEncomenda.taxaEntrega) || 0)
                  ).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-lg transition w-full"
              >
                Salvar Encomenda e Dar Baixa no Filamento
              </button>
            </form>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-lg font-bold text-slate-200 mb-4">Lista de Encomendas</h2>
              {encomendas.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma encomenda registrada.</p>
              ) : (
                <div className="space-y-4">
                  {encomendas.map(enc => (
                    <div key={enc.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-200 text-base">{enc.produto_nome || enc.produtoNome} (x{enc.quantidade})</h3>
                          <p className="text-sm text-indigo-400 font-medium">Cliente: {enc.cliente}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-400 font-extrabold text-lg">R$ {enc.valor_total || enc.valorTotal}</span>
                          <button
                            onClick={() => excluirEncomenda(enc.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Excluir Encomenda"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                        {enc.contato && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{enc.contato}</span>
                          </div>
                        )}
                        {enc.endereco && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{enc.endereco}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Frete/Entrega: R$ {enc.taxa_entrega || enc.taxaEntrega || '0.00'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${enc.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-400' : enc.status === 'Imprimindo' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            Status: {enc.status || 'Pendente'}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          Data: {enc.data}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA CONVITES ================= */}
        {abaAtiva === 'convites' && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-slate-200 mb-2">Códigos de Convite</h2>
            <p className="text-slate-400 text-sm mb-6">Compartilhe estes códigos para permitir que novos usuários criem contas no sistema.</p>
            <div className="space-y-3">
              {accessCodes.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <code className="text-indigo-400 font-mono font-bold text-base">{c.code}</code>
                    <p className="text-xs text-slate-500 mt-1">{c.used ? 'Utilizado' : 'Disponível para uso'}</p>
                  </div>
                  {!c.used && (
                    <button onClick={() => { navigator.clipboard.writeText(c.code); setCopiedCode(c.code); setTimeout(() => setCopiedCode(''), 2000); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs flex items-center transition">
                      {copiedCode === c.code ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedCode === c.code ? 'Copiado!' : 'Copiar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}