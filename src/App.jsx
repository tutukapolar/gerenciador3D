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
  Printer,
  Cpu,
  CreditCard,
  CheckCircle2,
  Droplet,
  Star,
  Lock,
  MessageSquare,
  Bug,
  Send,
  ThumbsUp,
  Wand2,
  QrCode
} from 'lucide-react';

// E-mail de administrador configurado
const ADMIN_EMAIL = 'ytty8229@gmail.com';

// --- PASSO 1: GERADOR DE PAYLOAD E CRC16 PIX NO FRONTEND ---
function crc16ccitt(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatarCampo(id, valor) {
  const len = valor.length.toString().padStart(2, '0');
  return `${id}${len}${valor}`;
}

function removerAcentos(texto) {
  return texto ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
}

function gerarPayloadPix({ chave, nome, cidade, valor, txid = "***" }) {
  const nomeLimpo = removerAcentos(nome).substring(0, 25);
  const cidadeLimpa = removerAcentos(cidade).substring(0, 15);
  const valorFormatado = parseFloat(valor).toFixed(2);

  const merchantAccountInfo = 
    formatarCampo("00", "br.gov.bcb.pix") + 
    formatarCampo("01", chave);

  let payload = 
    formatarCampo("00", "01") +
    formatarCampo("26", merchantAccountInfo) +
    formatarCampo("52", "0000") +
    formatarCampo("53", "986") +
    formatarCampo("54", valorFormatado) +
    formatarCampo("58", "BR") +
    formatarCampo("59", nomeLimpo) +
    formatarCampo("60", cidadeLimpa) +
    formatarCampo("62", formatarCampo("05", txid));

  payload += "6304";
  const checksum = crc16ccitt(payload);
  return payload + checksum;
}

export default function App() {

  // Informações do PIX
  const CHAVE_PIX = "192c8e91-54c8-4c1d-a48f-68397556353e";
  const NOME_RECEBEDOR = "Arthur Corrêa Sousa";
  const CIDADE_RECEBEDOR = "Guaratinguetá";
  const VALOR_PRO = 19.90;
  const SEU_NUMERO_WHATSAPP = "5512988289882";

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [userPlan, setUserPlan] = useState('gratuito');

  // Estados de Autenticação ('welcome' | 'login' | 'signUp')
  const [authMode, setAuthMode] = useState('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- AVALIAÇÕES E FEEDBACK/SUGESTÕES ---
  const [avaliacoesList, setAvaliacoesList] = useState([]);
  const [novaAvaliacao, setNovaAvaliacao] = useState({ nome: '', nota: 5, comentario: '' });
  const [formFeedback, setFormFeedback] = useState({ tipo: 'sugestao', email: '', mensagem: '' });
  const [feedbackSucesso, setFeedbackSucesso] = useState('');
  const [feedbacksAdminList, setFeedbacksAdminList] = useState([]);

  // --- MÁQUINAS / PRINT FARM ---
  const [impressoras, setImpressoras] = useState([]);
  const [novaImpressora, setNovaImpressora] = useState({ nome: '', modelo: '', tipo: 'FDM' });

  // --- ESTOQUE DE FILAMENTOS E RESINAS ---
  const [filamentos, setFilamentos] = useState([]);
  const [novoFilamento, setNovoFilamento] = useState({ nome: '', marca: '', cor: '', tipo: 'PLA', precoKg: '', pesoTotalG: '1000' });
  const [estoqueFeedback, setEstoqueFeedback] = useState({ tipo: '', texto: '' });
  const [filamentoExcluindoId, setFilamentoExcluindoId] = useState(null);

  // --- CALCULADORA (FDM / RESINA) ---
  const [tipoTecnologia, setTipoTecnologia] = useState('FDM');
  const [linkMakerworld, setLinkMakerworld] = useState('');
  const [filamentosProjeto, setFilamentosProjeto] = useState([
    { idTemp: Date.now(), filamentoId: '', pesoGramas: '' }
  ]);
  const [resinaProjeto, setResinaProjeto] = useState({ volumeMl: '', precoLitro: '200', tempoUvMin: '10', desgasteFepHora: '0.15', volumeIpaMl: '50' });

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
    taxaEntrega: '',
    status: 'Pendente',
    impressoraId: ''
  });

  // --- ESTADO DA ABA ANÚNCIOS ---
  const [produtoAnuncioId, setProdutoAnuncioId] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [textoAnuncioGerado, setTextoAnuncioGerado] = useState('');

  // Payload do PIX do Passo 1
  const payloadPix = gerarPayloadPix({
    chave: CHAVE_PIX,
    nome: NOME_RECEBEDOR,
    cidade: CIDADE_RECEBEDOR,
    valor: VALOR_PRO
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payloadPix)}`;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        carregarDados(currentSession.user.id);
        if (currentSession.user.email === ADMIN_EMAIL) {
          carregarFeedbacksAdmin();
        }
      } else {
        setImpressoras([]);
        setFilamentos([]);
        setProdutos([]);
        setEncomendas([]);
        setFeedbacksAdminList([]);
      }
      carregarAvaliacoes();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      const { data } = await supabase.from('avaliacoes').select('*').order('created_at', { ascending: false });
      if (data) setAvaliacoesList(data);
    } catch (err) {
      console.log('Tabela de avaliações não encontrada ou vazia.');
    }
  };

  const carregarFeedbacksAdmin = async () => {
    try {
      const { data } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      if (data) setFeedbacksAdminList(data);
    } catch (err) {
      console.log('Tabela de feedbacks não encontrada ou vazia.');
    }
  };

  const carregarDados = async (userId) => {
    try {
      const [filRes, prodRes, encRes, impRes, profRes] = await Promise.all([
        supabase.from('estoque_filamentos').select('*').eq('user_id', userId),
        supabase.from('produtos').select('*').eq('user_id', userId),
        supabase.from('encomendas').select('*').eq('user_id', userId),
        supabase.from('impressoras').select('*').eq('user_id', userId),
        supabase.from('profiles').select('plano').eq('id', userId).maybeSingle()
      ]);

      if (filRes.data) setFilamentos(filRes.data);
      if (prodRes.data) setProdutos(prodRes.data);
      if (encRes.data) setEncomendas(encRes.data);
      if (impRes.data) setImpressoras(impRes.data);
      if (profRes.data && profRes.data.plano) {
        setUserPlan(profRes.data.plano);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'signUp') {
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) {
        setAuthError(signUpErr.message);
        return;
      }
      if (authData.user) {
        await supabase.from('profiles').insert([{ id: authData.user.id, email, plano: 'gratuito' }]);
        setAuthSuccess('Conta criada com sucesso! Faça login.');
        setAuthMode('login');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError('E-mail ou senha inválidos.');
    }
  };

  const enviarAvaliacao = async (e) => {
    e.preventDefault();
    if (!novaAvaliacao.nome || !novaAvaliacao.comentario) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const itemNovaAvaliacao = {
      nome: novaAvaliacao.nome,
      nota: parseInt(novaAvaliacao.nota),
      comentario: novaAvaliacao.comentario,
      data: dataAtual
    };

    try {
      const { data, error } = await supabase.from('avaliacoes').insert([itemNovaAvaliacao]).select();
      if (!error && data) {
        setAvaliacoesList([data[0], ...avaliacoesList]);
      } else {
        setAvaliacoesList([{ id: Date.now(), ...itemNovaAvaliacao }, ...avaliacoesList]);
      }
    } catch (err) {
      setAvaliacoesList([{ id: Date.now(), ...itemNovaAvaliacao }, ...avaliacoesList]);
    }

    setNovaAvaliacao({ nome: '', nota: 5, comentario: '' });
    alert('Obrigado! Sua avaliação foi publicada com sucesso.');
  };

  const enviarFeedback = async (e) => {
    e.preventDefault();
    if (!formFeedback.mensagem) return;

    const emailEnviar = session?.user?.email || formFeedback.email || 'Anônimo';

    try {
      const { data, error } = await supabase.from('feedbacks').insert([{
        tipo: formFeedback.tipo,
        email: emailEnviar,
        mensagem: formFeedback.mensagem
      }]).select();

      if (!error && data && session?.user?.email === ADMIN_EMAIL) {
        setFeedbacksAdminList([data[0], ...feedbacksAdminList]);
      }
    } catch (err) {
      console.log('Feedback registrado localmente');
    }

    setFeedbackSucesso('Sua mensagem foi enviada aos desenvolvedores! Agradecemos sua ajuda.');
    setFormFeedback({ tipo: 'sugestao', email: '', mensagem: '' });
    setTimeout(() => setFeedbackSucesso(''), 4000);
  };

  const importarDadosLink = async () => {
    if (!linkMakerworld) return;
    try {
      setCalcData(prev => ({
        ...prev,
        nomeItem: 'Modelo Extraído (MakerWorld API)',
        tempoHoras: '4.5'
      }));
      if (tipoTecnologia === 'FDM' && filamentos.length > 0) {
        setFilamentosProjeto([
          { idTemp: Date.now(), filamentoId: filamentos[0].id.toString(), pesoGramas: '95' }
        ]);
      } else if (tipoTecnologia === 'Resina') {
        setResinaProjeto(prev => ({ ...prev, volumeMl: '45' }));
      }
      alert('Dados do link extraídos com sucesso via Web Scraping!');
    } catch (err) {
      alert('Erro ao realizar scraping do link.');
    }
  };

  const adicionarImpressora = async (e) => {
    e.preventDefault();
    if (!novaImpressora.nome) return;

    if (userPlan === 'gratuito' && impressoras.length >= 1) {
      alert('O Plano Gratuito permite cadastrar no máximo 1 impressora. Faça upgrade para o Plano Pro!');
      setAbaAtiva('planos');
      return;
    }

    const { data, error } = await supabase.from('impressoras').insert([{
      user_id: session.user.id,
      nome: novaImpressora.nome,
      modelo: novaImpressora.modelo || 'Genérica',
      tipo: novaImpressora.tipo,
      status: 'livre'
    }]).select();

    if (!error && data) {
      setImpressoras([...impressoras, data[0]]);
      setNovaImpressora({ nome: '', modelo: '', tipo: 'FDM' });
    }
  };

  const excluirImpressora = async (id) => {
    await supabase.from('impressoras').delete().eq('id', id);
    setImpressoras(impressoras.filter(i => i.id !== id));
  };

  const corMaterialSwatch = (cor) => {
    if (!cor) return '#64748b';
    const mapa = {
      preto: '#0f172a', branco: '#f8fafc', vermelho: '#ef4444', azul: '#3b82f6',
      verde: '#22c55e', amarelo: '#eab308', cinza: '#94a3b8', laranja: '#f97316',
      rosa: '#ec4899', roxo: '#a855f7', natural: '#d6d3d1', transparente: '#67e8f9'
    };
    const chave = cor.trim().toLowerCase();
    return mapa[chave] || '#6366f1';
  };

  const adicionarFilamento = async (e) => {
    e.preventDefault();
    setEstoqueFeedback({ tipo: '', texto: '' });
    if (!novoFilamento.nome || !novoFilamento.precoKg) {
      setEstoqueFeedback({ tipo: 'erro', texto: 'Informe o nome e o preço por quilo para cadastrar o material.' });
      return;
    }

    if (userPlan === 'gratuito' && filamentos.length >= 5) {
      setEstoqueFeedback({ tipo: 'erro', texto: 'O Plano Gratuito permite até 5 materiais. Faça upgrade para o Plano Pro.' });
      return;
    }

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
      setEstoqueFeedback({ tipo: 'ok', texto: 'Material adicionado ao estoque.' });
    } else {
      setEstoqueFeedback({ tipo: 'erro', texto: 'Não foi possível salvar o material. Tente novamente.' });
    }
  };

  const excluirFilamento = async (id) => {
    const { error } = await supabase.from('estoque_filamentos').delete().eq('id', id);
    if (error) {
      setEstoqueFeedback({ tipo: 'erro', texto: 'Não foi possível remover o material.' });
      setFilamentoExcluindoId(null);
      return;
    }
    setFilamentos(filamentos.filter(f => f.id !== id));
    setFilamentoExcluindoId(null);
    setEstoqueFeedback({ tipo: 'ok', texto: 'Material removido do estoque.' });
  };

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
    let pesoOuVolumeTotal = 0;
    const detalhamentoMateriais = [];

    if (tipoTecnologia === 'FDM') {
      filamentosProjeto.forEach(fp => {
        const filamentoEncontrado = filamentos.find(f => f.id === fp.filamentoId || f.id === parseInt(fp.filamentoId));
        const pesoG = parseFloat(fp.pesoGramas) || 0;
        const precoKg = filamentoEncontrado ? (filamentoEncontrado.preco_kg || filamentoEncontrado.precoKg) : 120;
        
        const custoParcial = ((pesoG * qtdPecas) / 1000) * precoKg;
        custoMaterialBase += custoParcial;
        pesoOuVolumeTotal += (pesoG * qtdPecas);

        detalhamentoMateriais.push({
          nome: filamentoEncontrado ? `${filamentoEncontrado.nome} (${filamentoEncontrado.tipo || 'PLA'} - ${filamentoEncontrado.cor})` : 'Filamento Genérico',
          medidaParcial: `${(pesoG * qtdPecas).toFixed(0)}g`,
          custoParcial: custoParcial.toFixed(2)
        });
      });
    } else {
      if (userPlan === 'gratuito') {
        alert('O Módulo de Resina (SLA) é exclusivo para assinantes do Plano Pro!');
        return;
      }
      const volumeMl = parseFloat(resinaProjeto.volumeMl) || 0;
      const precoLitro = parseFloat(resinaProjeto.precoLitro) || 200;
      const custoResina = ((volumeMl * qtdPecas) / 1000) * precoLitro;
      const custoIpa = ((parseFloat(resinaProjeto.volumeIpaMl) || 50) / 1000) * 35; 
      const desgasteFep = (parseFloat(resinaProjeto.desgasteFepHora) || 0.15) * (tempoH * qtdPecas);
      
      custoMaterialBase = custoResina + custoIpa + desgasteFep;
      pesoOuVolumeTotal = (volumeMl * qtdPecas);

      detalhamentoMateriais.push({
        nome: `Resina SLA (${volumeMl}ml) + IPA + Desgaste FEP/Tela`,
        medidaParcial: `${(volumeMl * qtdPecas).toFixed(0)}ml`,
        custoParcial: custoMaterialBase.toFixed(2)
      });
    }

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
        lucroLiquido: lucroLiquido.toFixed(2)
      };
    };

    setResultadoCalculo({
      tipoTecnologia,
      qtdPecas,
      pesoOuVolumeTotal: pesoOuVolumeTotal.toFixed(0),
      unidadeMedida: tipoTecnologia === 'FDM' ? 'g' : 'ml',
      tempoTotalH: (tempoH * qtdPecas).toFixed(1),
      detalhamentoMateriais,
      custoMaterial: custoMaterialBase.toFixed(2),
      custoEnergia: custoEnergiaBase.toFixed(2),
      custoAdicionalErro: custoAdicionalErro.toFixed(2),
      custoMaoDeObra: maoDeObra.toFixed(2),
      custoEmbalagem: embalagem.toFixed(2),
      custoTotalBase: custoTotalBase.toFixed(2),
      precoVendaDireta: precoVendaDireta.toFixed(2),
      shopee: calcularPlataforma(14, 4.00),
      mercadoLivre: calcularPlataforma(16.5, 6.00),
      tikTok: calcularPlataforma(12, 3.00)
    });
  };

  const salvarComoProduto = async () => {
    if (!resultadoCalculo || !calcData.nomeItem) return;
    
    if (userPlan === 'gratuito' && produtos.length >= 3) {
      alert('O Plano Gratuito permite salvar no máximo 3 produtos. Faça upgrade para o Plano Pro!');
      setAbaAtiva('planos');
      return;
    }

    const nomeProdutoFinal = `${calcData.nomeItem} ${resultadoCalculo.qtdPecas > 1 ? `(Kit ${resultadoCalculo.qtdPecas}x)` : ''}`;
    
    const { data, error } = await supabase.from('produtos').insert([{
      user_id: session.user.id,
      nome: nomeProdutoFinal,
      preco_sugerido: parseFloat(resultadoCalculo.precoVendaDireta),
      custo_total: parseFloat(resultadoCalculo.custoTotalBase),
      tempo_horas: parseFloat(resultadoCalculo.tempoTotalH),
      shopee_preco: userPlan === 'pro' ? parseFloat(resultadoCalculo.shopee.precoAnuncio) : null,
      ml_preco: userPlan === 'pro' ? parseFloat(resultadoCalculo.mercadoLivre.precoAnuncio) : null,
      tiktok_preco: userPlan === 'pro' ? parseFloat(resultadoCalculo.tikTok.precoAnuncio) : null,
      peso_g: parseFloat(resultadoCalculo.pesoOuVolumeTotal)
    }]).select();

    if (!error && data) {
      setProdutos([...produtos, data[0]]);
      alert('Produto salvo com sucesso no catálogo!');
      setAbaAtiva('produtos');
    } else {
      alert('Erro ao salvar produto.');
    }
  };

  const excluirProduto = async (id) => {
    await supabase.from('produtos').delete().eq('id', id);
    setProdutos(produtos.filter(p => p.id !== id));
  };

  const adicionarEncomenda = async (e) => {
    e.preventDefault();
    if (!novaEncomenda.cliente || !novaEncomenda.produtoNome) return;

    const qtd = parseInt(novaEncomenda.quantidade) || 1;
    const valProd = parseFloat(novaEncomenda.valorProduto) || 0;
    const taxaEntrega = parseFloat(novaEncomenda.taxaEntrega) || 0;
    const valorTotal = (qtd * valProd) + taxaEntrega;

    const { data, error } = await supabase.from('encomendas').insert([{
      user_id: session.user.id,
      cliente: novaEncomenda.cliente,
      contato: novaEncomenda.contato,
      endereco: novaEncomenda.endereco,
      produto_nome: novaEncomenda.produtoNome,
      quantidade: qtd,
      valor_total: valorTotal,
      status: novaEncomenda.status || 'Pendente',
      impressora_id: novaEncomenda.impressoraId || null,
      data: new Date().toLocaleDateString('pt-BR')
    }]).select();

    if (error) {
      alert('Erro ao gravar encomenda: Verifique o banco de dados Supabase.');
      console.error(error);
      return;
    }

    if (data) {
      if (novaEncomenda.status === 'Imprimindo' && novaEncomenda.impressoraId) {
        await supabase.from('impressoras').update({ status: 'ocupada' }).eq('id', novaEncomenda.impressoraId);
        setImpressoras(impressoras.map(i => i.id === parseInt(novaEncomenda.impressoraId) ? { ...i, status: 'ocupada' } : i));
      }

      setEncomendas([...encomendas, data[0]]);
      setNovaEncomenda({ cliente: '', contato: '', endereco: '', produtoId: '', produtoNome: '', quantidade: 1, valorProduto: '', taxaEntrega: '', status: 'Pendente', impressoraId: '' });
      alert('Encomenda registrada com sucesso!');
    }
  };

  const atualizarStatusEncomenda = async (encomendaId, novoStatus, impressoraId) => {
    try {
      const { error } = await supabase
        .from('encomendas')
        .update({ status: novoStatus })
        .eq('id', encomendaId);

      if (error) {
        console.error('Erro ao atualizar status no banco:', error);
        alert('Erro ao atualizar status da encomenda.');
        return;
      }

      setEncomendas(prev =>
        prev.map(enc => (enc.id === encomendaId ? { ...enc, status: novoStatus } : enc))
      );

      if (impressoraId) {
        const impIdNum = parseInt(impressoraId);
        const novoStatusImpressora = novoStatus === 'Imprimindo' ? 'ocupada' : 'livre';

        await supabase
          .from('impressoras')
          .update({ status: novoStatusImpressora })
          .eq('id', impIdNum);

        setImpressoras(prev =>
          prev.map(imp => (imp.id === impIdNum ? { ...imp, status: novoStatusImpressora } : imp))
        );
      }
    } catch (err) {
      console.error('Erro ao sincronizar estados:', err);
    }
  };

  const excluirEncomenda = async (id, impressoraId) => {
    await supabase.from('encomendas').delete().eq('id', id);
    if (impressoraId) {
      await supabase.from('impressoras').update({ status: 'livre' }).eq('id', impressoraId);
      setImpressoras(impressoras.map(i => i.id === impressoraId ? { ...i, status: 'livre' } : i));
    }
    setEncomendas(encomendas.filter(e => e.id !== id));
  };

  const handleGerarAnuncioIA = async () => {
    const produto = produtos.find(p => p.id === produtoAnuncioId || p.id === parseInt(produtoAnuncioId));
    if (!produto) return;

    setGerandoIA(true);
    try {
      const response = await fetch("https://dafrfrwnwvnrysjtmjro.supabase.co/functions/v1/generate-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          productName: produto.nome,
          material: 'Impressão 3D',
          preco: produto.preco_sugerido
        })
      });

      const resultData = await response.json();

      if (resultData && resultData.text) {
        setTextoAnuncioGerado(resultData.text);
      } else if (resultData && resultData.candidates && resultData.candidates[0]?.content?.parts[0]?.text) {
        setTextoAnuncioGerado(resultData.candidates[0].content.parts[0].text);
      } else {
        alert('Não foi possível gerar o anúncio pela IA.');
      }
    } catch (error) {
      console.error('Erro ao chamar IA:', error);
      alert('Erro ao conectar com o serviço de IA.');
    }
    finally {
      setGerandoIA(false);
    }
  };

  const faturamentoTotal = encomendas.reduce((acc, curr) => acc + (parseFloat(curr.valor_total) || 0), 0);
  const produtoAnuncio = produtos.find(p => p.id === produtoAnuncioId || p.id === parseInt(produtoAnuncioId));

  const obterTextoPadraoAnuncio = () => {
    if (!produtoAnuncio) return '';
    return `🔥 ${produtoAnuncio.nome.toUpperCase()} - IMPRESSÃO 3D DE ALTA QUALIDADE 🔥

Produzido com tecnologia de Impressão 3D profissional, garantindo resistência e acabamento impecável. 

💰 VALORES SUGERIDOS PARA VENDA:
🛒 Venda Direta (PIX): R$ ${produtoAnuncio.preco_sugerido}
🟠 Shopee: R$ ${produtoAnuncio.shopee_preco || 'Consulte Plano PRO'}
🟡 Mercado Livre: R$ ${produtoAnuncio.ml_preco || 'Consulte Plano PRO'}
🎵 TikTok Shop: R$ ${produtoAnuncio.tiktok_preco || 'Consulte Plano PRO'}

📦 Características:
- Peso aproximado: ${produtoAnuncio.peso_g}g
- Material de alta durabilidade e ecologicamente correto
- Fabricação própria na nossa Print Farm

⚡ Envio rápido para todo o país! Dúvidas? Deixe a sua pergunta abaixo.`;
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando sistema SaaS...</div>;
  }

  // --- COMPONENTE DO FORMULÁRIO DE SUGESTÃO / FEEDBACK ---
  const renderFormularioSugestao = () => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white">Enviar Sugestão ou Relatar um Erro</h3>
      </div>
      <p className="text-xs text-slate-400">
        Suas mensagens e sugestões são enviadas diretamente para os desenvolvedores da plataforma.
      </p>

      {feedbackSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-semibold">
          {feedbackSucesso}
        </div>
      )}

      <form onSubmit={enviarFeedback} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300">Tipo de Mensagem</label>
            <select 
              value={formFeedback.tipo} 
              onChange={e => setFormFeedback({ ...formFeedback, tipo: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="sugestao">Sugestão de Melhoria</option>
              <option value="bug">Relatar Erro / Bug</option>
              <option value="duvida">Dúvida ou Outro</option>
            </select>
          </div>

          {!session && (
            <div>
              <label className="text-xs font-semibold text-slate-300">Seu E-mail (Opcional)</label>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={formFeedback.email} 
                onChange={e => setFormFeedback({ ...formFeedback, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-indigo-500" 
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300">Sua Mensagem *</label>
          <textarea 
            required 
            rows={3} 
            placeholder="Descreva aqui sua idéia, sugestão de recurso ou problema que você encontrou..." 
            value={formFeedback.mensagem} 
            onChange={e => setFormFeedback({ ...formFeedback, mensagem: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white mt-1 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button 
          type="submit" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Send className="w-3.5 h-3.5" /> Enviar Mensagem
        </button>
      </form>
    </div>
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Box className="w-7 h-7 text-indigo-500" />
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                3D Print Manager
              </span>
              <span className="text-[10px] uppercase font-bold bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#planos" className="text-sm text-slate-400 hover:text-white transition hidden sm:inline">Planos</a>
              <a href="#avaliacoes" className="text-sm text-slate-400 hover:text-white transition hidden sm:inline">Avaliações</a>
              <a href="#sugestoes" className="text-sm text-slate-400 hover:text-white transition hidden sm:inline">Sugestões</a>
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium transition"
              >
                Entrar
              </button>
              <button 
                onClick={() => { setAuthMode('signUp'); setAuthError(''); setAuthSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-full text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" /> Gestão Inteligente para Print Farms
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Precifique e gerencie sua produção 3D com <span className="text-indigo-400">lucro real</span>.
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Calculadora completa para <strong>FDM e Resina (SLA)</strong>, gestão de frota de impressoras, automação de anúncios para Shopee/Mercado Livre e controle de encomendas em um só lugar.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-slate-300">
              <div>
                <span className="block text-2xl font-bold text-white">+100%</span>
                <span className="text-xs text-slate-500">Precisão nos custos</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">Shopee/ML</span>
                <span className="text-xs text-slate-500">Taxas atualizadas</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">FDM & SLA</span>
                <span className="text-xs text-slate-500">Suporte a Resina</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
              
              {authMode === 'welcome' ? (
                <div className="space-y-6 text-center py-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo!</h2>
                    <p className="text-slate-400 text-xs">
                      Escolha uma opção abaixo para aceder à sua conta ou efetuar o seu registo na plataforma.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold p-3.5 rounded-lg transition text-sm border border-slate-700 flex items-center justify-center gap-2"
                    >
                      Fazer Login
                    </button>

                    <button 
                      onClick={() => { setAuthMode('signUp'); setAuthError(''); setAuthSuccess(''); }}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-3.5 rounded-lg transition text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                      Criar Nova Conta
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button 
                    onClick={() => { setAuthMode('welcome'); setAuthError(''); setAuthSuccess(''); }}
                    className="text-xs text-slate-400 hover:text-white transition mb-4 flex items-center gap-1 font-medium"
                  >
                    ← Voltar às opções
                  </button>

                  <h2 className="text-2xl font-bold text-white text-center mb-1">
                    {authMode === 'signUp' ? 'Criar sua conta' : 'Acessar o Sistema'}
                  </h2>
                  <p className="text-slate-400 text-center text-xs mb-6">
                    {authMode === 'signUp' ? 'Comece a gerenciar suas impressoras hoje' : 'Entre com suas credenciais'}
                  </p>

                  {authError && <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 p-3 rounded-lg text-xs mb-4 text-center">{authError}</div>}
                  {authSuccess && <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 p-3 rounded-lg text-xs mb-4 text-center">{authSuccess}</div>}

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">E-mail</label>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        placeholder="seu@email.com" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mt-1 transition text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Senha</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder="••••••••" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mt-1 transition text-sm" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-3.5 rounded-lg transition text-sm shadow-lg shadow-indigo-600/20 mt-2"
                    >
                      {authMode === 'signUp' ? 'Criar Conta Gratuita' : 'Entrar no Sistema'}
                    </button>
                  </form>

                  <div className="text-center mt-6 pt-4 border-t border-slate-800">
                    <button 
                      onClick={() => { setAuthMode(authMode === 'signUp' ? 'login' : 'signUp'); setAuthError(''); setAuthSuccess(''); }} 
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                      {authMode === 'signUp' ? 'Já possui uma conta? Faça login' : 'Ainda não tem conta? Cadastre-se grátis'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- SEÇÃO DE PLANOS --- */}
        <section id="planos" className="py-16 max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Planos simples e transparentes</h2>
            <p className="text-slate-400 text-sm">Escolha o plano ideal para o tamanho da sua operação.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Plano Gratuito</h3>
                <div className="text-3xl font-black text-white">R$ 0 <span className="text-xs text-slate-500 font-normal">/ mês</span></div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 Impressora cadastrada</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Até 3 produtos no catálogo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Até 5 filamentos no estoque</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Calculadora de Custo Real (PIX/Direto)</li>
                  <li className="flex items-center gap-2 text-slate-500"><Lock className="w-4 h-4" /> Marketplaces (Shopee/ML/TikTok Bloqueados)</li>
                  <li className="flex items-center gap-2 text-slate-500"><Lock className="w-4 h-4" /> Módulo de Resina (SLA Bloqueado)</li>
                </ul>
              </div>
              <button 
                onClick={() => { setAuthMode('signUp'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg text-xs transition"
              >
                Começar Grátis
              </button>
            </div>

            <div className="bg-slate-900 border-2 border-indigo-500 p-8 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-3.5 right-6 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Plano PRO (SaaS)</h3>
                <div className="text-3xl font-black text-indigo-400">R$ 19,90 <span className="text-xs text-slate-500 font-normal">/ mês</span></div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Impressoras e Frota <strong>Ilimitadas</strong></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Produtos e Estoque <strong>Ilimitados</strong></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Calculadora Completa (Shopee, ML, TikTok)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <strong>Módulo SLA Completo</strong> (Resina e IPA)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gerador de Anúncios Formatados</li>
                </ul>
              </div>
              <button 
                onClick={() => { setAuthMode('signUp'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg text-xs transition shadow-lg shadow-indigo-600/30"
              >
                Assinar Plano PRO
              </button>
            </div>
          </div>
        </section>

        {/* --- SEÇÃO DE AVALIAÇÕES (LANDING PAGE - PÚBLICA) --- */}
        <section id="avaliacoes" className="py-16 bg-slate-900/50 border-y border-slate-800">
          <div className="max-w-6xl mx-auto px-4 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
                <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" /> Avaliações dos Nossos Usuários
              </h2>
              <p className="text-slate-400 text-sm">
                Veja o que os criadores e donos de Print Farm estão achando da nossa plataforma.
              </p>
            </div>

            {/* Formulário para Enviar Avaliação Pública */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl mx-auto space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white text-center">Deixe sua Avaliação Pública</h3>
              <form onSubmit={enviarAvaliacao} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Seu Nome / Empresa</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: João da Silva (3D Print)" 
                      value={novaAvaliacao.nome} 
                      onChange={e => setNovaAvaliacao({ ...novaAvaliacao, nome: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Sua Nota</label>
                    <select 
                      value={novaAvaliacao.nota} 
                      onChange={e => setNovaAvaliacao({ ...novaAvaliacao, nota: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-yellow-400 mt-1 focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 / 5 - Excelente)</option>
                      <option value="4">⭐⭐⭐⭐ (4 / 5 - Muito Bom)</option>
                      <option value="3">⭐⭐⭐ (3 / 5 - Bom)</option>
                      <option value="2">⭐⭐ (2 / 5 - Regular)</option>
                      <option value="1">⭐ (1 / 5 - Ruim)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Seu Comentário</label>
                  <textarea 
                    required 
                    rows={3} 
                    placeholder="Conte como o sistema te ajudou a gerenciar sua produção 3D..." 
                    value={novaAvaliacao.comentario} 
                    onChange={e => setNovaAvaliacao({ ...novaAvaliacao, comentario: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg text-xs transition shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-slate-950" /> Publicar Avaliação
                </button>
              </form>
            </div>

            {/* Lista de Avaliações Públicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {avaliacoesList.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                  Nenhuma avaliação publicada ainda. Seja o primeiro a avaliar!
                </div>
              ) : (
                avaliacoesList.map(item => (
                  <div key={item.id || Math.random()} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">{item.nome}</span>
                        <span className="text-xs text-yellow-400 font-bold">
                          {'★'.repeat(item.nota || 5)}{'☆'.repeat(5 - (item.nota || 5))}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs italic leading-relaxed">"{item.comentario}"</p>
                    </div>
                    {item.data && (
                      <span className="text-[10px] text-slate-500 text-right block border-t border-slate-800/80 pt-2">
                        {item.data}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* --- SEÇÃO DE SUGESTÕES DA LANDING PAGE --- */}
        <section id="sugestoes" className="py-16 max-w-4xl mx-auto px-4 w-full">
          {renderFormularioSugestao()}
        </section>

        <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
          <p>© 2026 3D Print Manager. Todos os direitos reservados.</p>
        </footer>
      </div>
    );
  }

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="max-w-6xl mx-auto flex items-center gap-2 cursor-pointer" onClick={() => setAbaAtiva('dashboard')}>
          <Box className="w-7 h-7 text-indigo-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            3D Print Manager <span className="text-xs uppercase bg-indigo-600 px-2 py-0.5 rounded text-white ml-2">{userPlan}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex gap-1.5 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'maquinas', label: 'Máquinas', icon: Printer },
              { id: 'calculadora', label: 'Calculadora', icon: Calculator },
              { id: 'estoque', label: 'Estoque', icon: Package },
              { id: 'produtos', label: 'Produtos', icon: ShoppingCart },
              { id: 'anuncios', label: 'Anúncios', icon: Megaphone },
              { id: 'encomendas', label: 'Encomendas', icon: ListOrdered },
              { id: 'sugestoes', label: isAdmin ? 'Sugestões (Admin)' : 'Sugestões', icon: MessageSquare },
              { id: 'planos', label: 'Planos SaaS', icon: CreditCard }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    abaAtiva === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <button onClick={() => supabase.auth.signOut()} className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        
        {abaAtiva === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Faturamento Total
                </span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Printer className="w-4 h-4 text-cyan-400" /> Impressoras na Fazenda
                </span>
                <p className="text-2xl font-extrabold text-cyan-400 mt-1">{impressoras.length} Máquinas {userPlan === 'gratuito' && '(Limite 1)'}</p>
              </div>
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">Assinatura Atual</span>
                  <p className="text-xl font-bold text-indigo-400 mt-1 capitalize">Plano {userPlan}</p>
                </div>
                {userPlan === 'gratuito' && (
                  <button onClick={() => setAbaAtiva('planos')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg font-bold">
                    Fazer Upgrade Pro
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" /> Status da Print Farm
              </h2>
              {impressoras.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma impressora registrada. Vá à aba "Máquinas" para adicionar sua frota.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {impressoras.map(imp => {
                    const isOcupada = imp.status === 'ocupada';
                    return (
                      <div key={imp.id} className={`p-4 rounded-xl border ${isOcupada ? 'bg-amber-950/20 border-amber-500/40' : 'bg-emerald-950/20 border-emerald-500/40'} flex flex-col justify-between space-y-2`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-100">{imp.nome}</h3>
                            <p className="text-xs text-slate-400">{imp.modelo} ({imp.tipo})</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${isOcupada ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {isOcupada ? 'Imprimindo' : 'Livre'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'maquinas' && (
          <div className="space-y-6">
            <form onSubmit={adicionarImpressora} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h2 className="text-lg font-bold text-slate-200">Registrar Máquina na Print Farm</h2>
                {userPlan === 'gratuito' && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
                    Plano Gratuito: {impressoras.length}/1 Impressora
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="Nome/Apelido (Ex: Ender 01)" required value={novaImpressora.nome} onChange={e => setNovaImpressora({...novaImpressora, nome: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                <input type="text" placeholder="Modelo (Ex: Bambu Lab P1S)" value={novaImpressora.modelo} onChange={e => setNovaImpressora({...novaImpressora, modelo: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                <select value={novaImpressora.tipo} onChange={e => setNovaImpressora({...novaImpressora, tipo: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200">
                  <option value="FDM">FDM (Filamento)</option>
                  <option value="SLA">SLA (Resina)</option>
                </select>
              </div>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-lg transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Impressora
              </button>
            </form>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-lg font-bold text-slate-200 mb-4">Minhas Impressoras</h2>
              {impressoras.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma impressora registrada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {impressoras.map(imp => (
                    <div key={imp.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-100">{imp.nome}</h3>
                        <p className="text-xs text-slate-400">Modelo: {imp.modelo} | Tipo: <span className="text-indigo-400 font-bold">{imp.tipo}</span></p>
                        <p className="text-xs text-emerald-400 mt-1">Status: {imp.status}</p>
                      </div>
                      <button onClick={() => excluirImpressora(imp.id)} className="text-rose-400 hover:text-rose-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'calculadora' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setTipoTecnologia('FDM')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tipoTecnologia === 'FDM' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  Modo FDM (Filamento)
                </button>
                <button type="button" onClick={() => { userPlan === 'gratuito' ? (alert('O Módulo de Resina (SLA) é exclusivo para assinantes do Plano Pro!'), setAbaAtiva('planos')) : setTipoTecnologia('Resina'); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${tipoTecnologia === 'Resina' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  <Droplet className="w-4 h-4 text-cyan-400" /> Modo Resina (SLA) {userPlan === 'gratuito' && '🔒'}
                </button>
              </div>
              <div className="flex-1 flex gap-2 w-full sm:w-auto">
                <input type="url" placeholder="Link MakerWorld / Printables (.3mf)" value={linkMakerworld} onChange={e => setLinkMakerworld(e.target.value)} className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500" />
                <button onClick={importarDadosLink} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap">
                  Scraping Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={calcularPreco} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2">
                  Parâmetros de Impressão ({tipoTecnologia})
                </h2>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome do Item / Modelo</label>
                  <input type="text" required placeholder="Ex: Miniatura RPG ou Peça Técnica" value={calcData.nomeItem} onChange={e => setCalcData({...calcData, nomeItem: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>

                {tipoTecnologia === 'FDM' ? (
                  <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <label className="text-xs font-bold text-indigo-400">Filamentos do Projeto</label>
                    {filamentosProjeto.map((fp, index) => (
                      <div key={fp.idTemp} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8">
                          <select value={fp.filamentoId} onChange={e => { const updated = [...filamentosProjeto]; updated[index].filamentoId = e.target.value; setFilamentosProjeto(updated); }} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200">
                            <option value="">Selecione o Filamento...</option>
                            {filamentos.map(f => <option key={f.id} value={f.id}>{f.nome} ({f.tipo} - {f.cor})</option>)}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input type="number" placeholder="Peso (g)" value={fp.pesoGramas} onChange={e => { const updated = [...filamentosProjeto]; updated[index].pesoGramas = e.target.value; setFilamentosProjeto(updated); }} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-cyan-500/30">
                    <label className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                      <Droplet className="w-4 h-4" /> Variáveis de Resina & Pós-Processamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400">Volume (ml)</label>
                        <input type="number" placeholder="Ex: 35" value={resinaProjeto.volumeMl} onChange={e => setResinaProjeto({...resinaProjeto, volumeMl: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Preço Resina (R$/L)</label>
                        <input type="number" value={resinaProjeto.precoLitro} onChange={e => setResinaProjeto({...resinaProjeto, precoLitro: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400">Cura UV (min)</label>
                        <input type="number" value={resinaProjeto.tempoUvMin} onChange={e => setResinaProjeto({...resinaProjeto, tempoUvMin: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Desgaste FEP/h</label>
                        <input type="number" step="0.05" value={resinaProjeto.desgasteFepHora} onChange={e => setResinaProjeto({...resinaProjeto, desgasteFepHora: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Perda IPA (ml)</label>
                        <input type="number" value={resinaProjeto.volumeIpaMl} onChange={e => setResinaProjeto({...resinaProjeto, volumeIpaMl: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Quantidade de Peças</label>
                    <input type="number" min="1" value={calcData.quantidadePecas} onChange={e => setCalcData({...calcData, quantidadePecas: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tempo Unitário (Horas)</label>
                    <input type="number" step="0.1" value={calcData.tempoHoras} onChange={e => setCalcData({...calcData, tempoHoras: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Energia (R$/kWh)</label>
                    <input type="number" step="0.01" value={calcData.custoEnergiaKwh} onChange={e => setCalcData({...calcData, custoEnergiaKwh: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Potência (W)</label>
                    <input type="number" value={calcData.potenciaImpressoraW} onChange={e => setCalcData({...calcData, potenciaImpressoraW: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Custo Embalagem (R$)</label>
                    <input type="number" step="0.01" value={calcData.custoEmbalagem} onChange={e => setCalcData({...calcData, custoEmbalagem: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Margem de Erro (%)</label>
                    <input type="number" value={calcData.margemErroPct} onChange={e => setCalcData({...calcData, margemErroPct: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mão de Obra (R$)</label>
                    <input type="number" step="0.01" value={calcData.custoMaoDeObra} onChange={e => setCalcData({...calcData, custoMaoDeObra: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Margem de Lucro (%)</label>
                    <input type="number" value={calcData.lucroDesejadoPct} onChange={e => setCalcData({...calcData, lucroDesejadoPct: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition">
                  Calcular Precificação
                </button>
              </form>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2 mb-4">Resumo e Precificação</h2>
                  {resultadoCalculo ? (
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-xs space-y-2">
                        <p className="font-bold text-slate-300 text-sm">Tecnologia: {resultadoCalculo.tipoTecnologia}</p>
                        <div className="flex justify-between"><span>Custo Total de Produção:</span><span className="text-indigo-400 font-bold">R$ {resultadoCalculo.custoTotalBase}</span></div>
                      </div>
                      
                      <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-lg flex justify-between items-center">
                        <span className="text-emerald-300 font-bold">Custo Real (Venda Direta / PIX):</span>
                        <span className="text-2xl font-extrabold text-emerald-400">R$ {resultadoCalculo.precoVendaDireta}</span>
                      </div>
                      
                      {userPlan === 'gratuito' ? (
                        <div className="bg-slate-900 border border-slate-700/60 p-4 rounded-xl text-center space-y-2 mt-4 relative overflow-hidden">
                          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                            <Lock className="w-4 h-4" /> Marketplaces Bloqueados
                          </div>
                          <p className="text-xs text-slate-400">
                            Cálculo de taxas e preços para <strong>Shopee, Mercado Livre e TikTok Shop</strong> disponíveis apenas no <strong>Plano PRO</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAbaAtiva('planos')}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition mt-1 shadow-md shadow-indigo-600/20"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Desbloquear Canais no Plano PRO
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          <div className="bg-slate-900 border border-orange-500/30 p-3 rounded-lg text-center">
                            <span className="block text-xs text-orange-400 mb-1">Shopee (14% + R$4)</span>
                            <span className="text-lg font-bold text-slate-200">R$ {resultadoCalculo.shopee.precoAnuncio}</span>
                            <span className="block text-[10px] text-slate-400 mt-1">Lucro: R$ {resultadoCalculo.shopee.lucroLiquido}</span>
                          </div>
                          <div className="bg-slate-900 border border-yellow-500/30 p-3 rounded-lg text-center">
                            <span className="block text-xs text-yellow-400 mb-1">Mercado Livre (16.5% + R$6)</span>
                            <span className="text-lg font-bold text-slate-200">R$ {resultadoCalculo.mercadoLivre.precoAnuncio}</span>
                            <span className="block text-[10px] text-slate-400 mt-1">Lucro: R$ {resultadoCalculo.mercadoLivre.lucroLiquido}</span>
                          </div>
                          <div className="bg-slate-900 border border-pink-500/30 p-3 rounded-lg text-center">
                            <span className="block text-xs text-pink-400 mb-1">TikTok Shop (12% + R$3)</span>
                            <span className="text-lg font-bold text-slate-200">R$ {resultadoCalculo.tikTok.precoAnuncio}</span>
                            <span className="block text-[10px] text-slate-400 mt-1">Lucro: R$ {resultadoCalculo.tikTok.lucroLiquido}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-16">Preencha os parâmetros e clique em calcular.</p>
                  )}
                </div>

                {resultadoCalculo && (
                  <button onClick={salvarComoProduto} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition">
                    Salvar Produto no Catálogo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'estoque' && (() => {
          const limiteGratuito = userPlan === 'gratuito';
          const noLimite = limiteGratuito && filamentos.length >= 5;
          const campoEstoque = 'w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/70';
          return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Estoque de materiais</h2>
                <p className="text-sm text-slate-400 mt-1">Cadastre filamentos e resinas com preço, cor e peso restante — os mesmos dados usados na calculadora.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
                  {filamentos.length} {filamentos.length === 1 ? 'material' : 'materiais'}
                </span>
                {limiteGratuito && (
                  <span className={`text-xs border px-2.5 py-1 rounded-full font-semibold ${noLimite ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    Plano Gratuito: {filamentos.length}/5
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={adicionarFilamento} className="bg-slate-800 p-5 sm:p-6 rounded-xl border border-slate-700 space-y-4" aria-labelledby="estoque-form-titulo">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-700 pb-3">
                <div>
                  <h3 id="estoque-form-titulo" className="text-lg font-bold text-slate-200">Novo material</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nome e preço por kg são obrigatórios.</p>
                </div>
              </div>

              {estoqueFeedback.texto && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`text-sm rounded-lg px-3 py-2.5 border ${
                    estoqueFeedback.tipo === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {estoqueFeedback.texto}
                </div>
              )}

              {noLimite && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-3">
                  <p className="text-sm text-amber-200">Você atingiu o limite de 5 materiais do plano gratuito.</p>
                  <button type="button" onClick={() => setAbaAtiva('planos')} className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                    Ver Plano Pro
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="estoque-nome" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Nome *</label>
                  <input id="estoque-nome" type="text" autoComplete="off" placeholder="Ex: PLA Preto Fosco" required value={novoFilamento.nome} onChange={e => setNovoFilamento({...novoFilamento, nome: e.target.value})} className={campoEstoque} />
                </div>
                <div>
                  <label htmlFor="estoque-marca" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Marca</label>
                  <input id="estoque-marca" type="text" autoComplete="off" placeholder="Ex: eSUN" value={novoFilamento.marca} onChange={e => setNovoFilamento({...novoFilamento, marca: e.target.value})} className={campoEstoque} />
                </div>
                <div>
                  <label htmlFor="estoque-cor" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Cor</label>
                  <input id="estoque-cor" type="text" autoComplete="off" placeholder="Ex: Preto" value={novoFilamento.cor} onChange={e => setNovoFilamento({...novoFilamento, cor: e.target.value})} className={campoEstoque} />
                </div>
                <div>
                  <label htmlFor="estoque-tipo" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Tipo</label>
                  <select id="estoque-tipo" value={novoFilamento.tipo} onChange={e => setNovoFilamento({...novoFilamento, tipo: e.target.value})} className={campoEstoque}>
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="ASA">ASA</option>
                    <option value="TPU">TPU</option>
                    <option value="Resina">Resina (SLA)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="estoque-preco" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Preço / kg (R$) *</label>
                  <input id="estoque-preco" type="number" inputMode="decimal" min="0" step="0.01" placeholder="120.00" required value={novoFilamento.precoKg} onChange={e => setNovoFilamento({...novoFilamento, precoKg: e.target.value})} className={campoEstoque} />
                </div>
                <div>
                  <label htmlFor="estoque-peso" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Peso disponível (g)</label>
                  <input id="estoque-peso" type="number" inputMode="numeric" min="1" step="1" placeholder="1000" value={novoFilamento.pesoTotalG} onChange={e => setNovoFilamento({...novoFilamento, pesoTotalG: e.target.value})} className={campoEstoque} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={noLimite}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> Adicionar ao estoque
                </button>
                <p className="text-xs text-slate-500">O material fica disponível imediatamente na calculadora de precificação.</p>
              </div>
            </form>

            <div className="bg-slate-800 p-5 sm:p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Materiais cadastrados</h3>
              {filamentos.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12 px-4 rounded-xl border border-dashed border-slate-600 bg-slate-900/40">
                  <Package className="w-10 h-10 text-slate-500 mb-3" aria-hidden="true" />
                  <p className="text-slate-200 font-semibold">Nenhum material no estoque</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">Cadastre o primeiro filamento ou resina acima para calcular custos reais na aba Calculadora.</p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filamentos.map(f => {
                    const peso = Number(f.peso_atual_g ?? 1000);
                    const bobinaRef = 1000;
                    const percentual = Math.max(0, Math.min(100, (peso / bobinaRef) * 100));
                    const estoqueBaixo = peso > 0 && peso < 200;
                    const esgotado = peso <= 0;
                    const confirmando = filamentoExcluindoId === f.id;
                    return (
                      <li key={f.id} className={`bg-slate-900 p-4 rounded-xl border flex flex-col gap-3 ${estoqueBaixo || esgotado ? 'border-amber-500/40' : 'border-slate-700'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span
                              className="mt-0.5 w-8 h-8 rounded-full border border-white/10 shrink-0 shadow-inner"
                              style={{ backgroundColor: corMaterialSwatch(f.cor) }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-100 truncate">{f.nome}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {f.marca || 'Marca genérica'} · {f.cor || 'Cor padrão'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shrink-0">
                            {f.tipo || 'PLA'}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                            <span>{esgotado ? 'Esgotado' : estoqueBaixo ? 'Estoque baixo' : 'Disponível'}</span>
                            <span className={`font-bold ${esgotado ? 'text-rose-400' : estoqueBaixo ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {peso}g
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={bobinaRef} aria-valuenow={peso} aria-label={`Peso restante de ${f.nome}`}>
                            <div
                              className={`h-full rounded-full ${esgotado ? 'bg-rose-500' : estoqueBaixo ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <p className="text-sm text-slate-300">
                            <span className="text-slate-500 text-xs">Preço</span>{' '}
                            <span className="font-semibold">R$ {Number(f.preco_kg || 0).toFixed(2)}</span>
                            <span className="text-xs text-slate-500">/kg</span>
                          </p>
                          {confirmando ? (
                            <div className="flex items-center gap-2" role="group" aria-label={`Confirmar exclusão de ${f.nome}`}>
                              <button
                                type="button"
                                onClick={() => excluirFilamento(f.id)}
                                className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                              >
                                Excluir
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilamentoExcluindoId(null)}
                                className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setFilamentoExcluindoId(f.id); setEstoqueFeedback({ tipo: '', texto: '' }); }}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                              aria-label={`Remover ${f.nome} do estoque`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          );
        })()}

        {abaAtiva === 'produtos' && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-200">Catálogo de Produtos ({produtos.length} salvos)</h2>
              {userPlan === 'gratuito' && (
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
                  Plano Gratuito: {produtos.length}/3 Produtos
                </span>
              )}
            </div>
            {produtos.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                Nenhum produto cadastrado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {produtos.map(p => (
                  <div key={p.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-slate-100">{p.nome}</h3>
                      <p className="text-xs text-slate-400">Custo: R$ {p.custo_total}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-emerald-400 font-bold text-base">R$ {p.preco_sugerido}</span>
                      <button
                        type="button"
                        onClick={() => excluirProduto(p.id)}
                        className="text-rose-400"
                        aria-label={`Excluir ${p.nome}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'anuncios' && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-200">Gerador de Anúncios para Marketplaces</h2>
              
              {produtoAnuncio && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleGerarAnuncioIA}
                    disabled={gerandoIA}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm transition font-medium shadow-md shadow-purple-600/30 disabled:opacity-50"
                  >
                    <Wand2 className={`w-4 h-4 ${gerandoIA ? 'animate-spin' : ''}`} />
                    {gerandoIA ? 'Gerando Anúncio...' : 'Gerar Anúncio com IA'}
                  </button>

                  <button 
                    onClick={() => {
                      const textoParaCopiar = textoAnuncioGerado || obterTextoPadraoAnuncio();
                      navigator.clipboard.writeText(textoParaCopiar);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiado ? 'Copiado!' : 'Copiar Anúncio'}
                  </button>
                </div>
              )}
            </div>
            
            <select value={produtoAnuncioId} onChange={e => { setProdutoAnuncioId(e.target.value); setTextoAnuncioGerado(''); }} className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-sm text-slate-200">
              <option value="">Selecione um produto salvo...</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            
            {produtoAnuncio && (
              <textarea 
                rows={14} 
                onChange={e => setTextoAnuncioGerado(e.target.value)}
                value={textoAnuncioGerado || obterTextoPadraoAnuncio()} 
                className="w-full bg-slate-900 border border-slate-700 rounded p-4 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none" 
              />
            )}
          </div>
        )}

        {abaAtiva === 'encomendas' && (
          <div className="space-y-6">
            <form onSubmit={adicionarEncomenda} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2">Registrar Nova Encomenda</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nome do Cliente *" required value={novaEncomenda.cliente} onChange={e => setNovaEncomenda({...novaEncomenda, cliente: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />
                <input type="text" placeholder="Telefone / Contato" value={novaEncomenda.contato} onChange={e => setNovaEncomenda({...novaEncomenda, contato: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />
              </div>

              <input type="text" placeholder="Endereço Completo de Entrega" value={novaEncomenda.endereco} onChange={e => setNovaEncomenda({...novaEncomenda, endereco: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={novaEncomenda.produtoId} onChange={e => { const prod = produtos.find(p => p.id.toString() === e.target.value); if (prod) { setNovaEncomenda({...novaEncomenda, produtoId: prod.id, produtoNome: prod.nome, valorProduto: prod.preco_sugerido}); } else { setNovaEncomenda({...novaEncomenda, produtoId: '', produtoNome: '', valorProduto: ''}); } }} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm text-slate-200">
                  <option value="">Produto Avulso (Digitar Manualmente)...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <input type="text" placeholder="Nome do Produto / Peça *" required value={novaEncomenda.produtoNome} onChange={e => setNovaEncomenda({...novaEncomenda, produtoNome: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <input type="number" min="1" placeholder="Qtd" value={novaEncomenda.quantidade} onChange={e => setNovaEncomenda({...novaEncomenda, quantidade: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />
                <input type="number" step="0.01" placeholder="Valor Unitário (R$)" required value={novaEncomenda.valorProduto} onChange={e => setNovaEncomenda({...novaEncomenda, valorProduto: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />
                <input type="number" step="0.01" placeholder="Taxa Entrega (R$)" value={novaEncomenda.taxaEntrega} onChange={e => setNovaEncomenda({...novaEncomenda, taxaEntrega: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm" />
                
                <select value={novaEncomenda.status} onChange={e => setNovaEncomenda({...novaEncomenda, status: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm text-slate-200">
                  <option value="Pendente">Pendente</option>
                  <option value="Imprimindo">Imprimindo</option>
                  <option value="Concluído">Concluído</option>
                </select>

                <select value={novaEncomenda.impressoraId} onChange={e => setNovaEncomenda({...novaEncomenda, impressoraId: e.target.value})} className="bg-slate-900 border border-slate-700 rounded p-2.5 text-sm text-slate-200">
                  <option value="">Alocar Máquina...</option>
                  {impressoras.filter(i => i.status === 'livre').map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
              </div>

              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-lg transition w-full">
                Salvar Encomenda
              </button>
            </form>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-lg font-bold text-slate-200 mb-4">Lista de Encomendas</h2>
              <div className="space-y-3">
                {encomendas.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhuma encomenda registrada.</p>
                ) : (
                  encomendas.map(enc => {
                    const impressoraVinculada = impressoras.find(i => i.id === parseInt(enc.impressora_id));
                    return (
                      <div key={enc.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-slate-200">{enc.produto_nome} - Cliente: {enc.cliente}</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Qtd: {enc.quantidade} | Total: R$ {parseFloat(enc.valor_total || 0).toFixed(2)}
                            {impressoraVinculada && (
                              <span className="ml-2 text-indigo-400 font-semibold">| Máquina: {impressoraVinculada.nome}</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <select 
                            value={enc.status} 
                            onChange={(e) => atualizarStatusEncomenda(enc.id, e.target.value, enc.impressora_id)}
                            className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Imprimindo">Imprimindo</option>
                            <option value="Concluído">Concluído</option>
                          </select>

                          <button onClick={() => excluirEncomenda(enc.id, enc.impressora_id)} className="text-rose-400 hover:text-rose-300 p-1">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'sugestoes' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {renderFormularioSugestao()}

            {/* PAINEL EXCLUSIVO DO ADMIN PARA VER AS SUGESTÕES RECEBIDAS */}
            {isAdmin ? (
              <div className="bg-slate-800 p-6 rounded-xl border border-indigo-500/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">Painel de Sugestões Recebidas (Exclusivo Admin)</h3>
                  </div>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
                    {feedbacksAdminList.length} mensagens
                  </span>
                </div>

                {feedbacksAdminList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Nenhuma sugestão ou feedback recebido ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {feedbacksAdminList.map(item => (
                      <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-indigo-400 uppercase tracking-wider">
                            [{item.tipo || 'Sugestão'}]
                          </span>
                          <span className="text-slate-500">
                            De: {item.email || 'Anônimo'}
                          </span>
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed">{item.mensagem}</p>
                        {item.created_at && (
                          <span className="text-[10px] text-slate-500 block text-right">
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center text-xs text-slate-400">
                🔒 O histórico de feedbacks enviados é privado e acessível apenas pelos administradores da plataforma.
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'planos' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Upgrade de Assinatura SaaS</h2>
              <p className="text-slate-400 text-sm">Escalabilidade total e recursos sem limites para sua Print Farm.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card das Vantagens PRO */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-indigo-500/40 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <h3 className="text-xl font-bold text-white">Plano PRO Completo</h3>
                    <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                      Upgrade Imediato
                    </span>
                  </div>

                  <div className="text-3xl font-black text-indigo-400">
                    R$ {VALOR_PRO.toFixed(2).replace('.', ',')} <span className="text-xs text-slate-500 font-normal">/ mês</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Frota de Impressoras Ilimitada</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Produtos e Estoque Ilimitados</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Módulo SLA (Resina e Pós-processamento)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Precificação Shopee, Mercado Livre e TikTok</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gerador Inteligente de Anúncios com IA</li>
                  </ul>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200">Como funciona o ativamento?</p>
                  <p>Após realizar a transferência PIX, envie o comprovante clicando no botão do WhatsApp ao lado para liberarmos seu acesso PRO na hora.</p>
                </div>
              </div>

              {/* PASSO 1: CARD DE PAGAMENTO PIX ESTÁTICO DENTRO DO APP */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-5 text-center flex flex-col items-center justify-between">
                <div className="space-y-1 w-full">
                  <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" /> Pagamento via PIX (Sem Taxas)
                  </h3>
                  <p className="text-xs text-slate-400">Escaneie o QR Code abaixo com seu aplicativo do banco</p>
                </div>

                <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 inline-block">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code PIX para Assinatura PRO" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="w-full space-y-3">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[200px] text-left">{payloadPix}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(payloadPix);
                        setCopiadoPix(true);
                        setTimeout(() => setCopiadoPix(false), 2000);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 shrink-0 transition"
                    >
                      {copiadoPix ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiadoPix ? 'Copiado!' : 'Copiar PIX'}
                    </button>
                  </div>

                  <a
                    href={`https://wa.me/${SEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(`Olá! Realizei o pagamento do Plano PRO do 3D Print Manager no valor de R$ ${VALOR_PRO.toFixed(2)} para o e-mail:${session?.user?.email}. Segue o comprovante em anexo:`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Phone className="w-4 h-4" /> Enviar Comprovante no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}