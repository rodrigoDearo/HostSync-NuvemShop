const axios = require('axios');

const { getProductsAndVariants, registerProduct, updateProduct, deleteProduct, registerCategory, deleteCategory, getVariants, registerVariation, updateVariation, deleteVariation, generateToken } = require('./requestsNuvemShop');
const { returnValueFromJson } = require('./manageInfoUser');
const { returnInfo } = require('../envManager');
const { gravarLog, successHandlingRequests } = require('./auxFunctions');
  
  async function getHeaderAndStore() {
    const cli_id = await returnInfo('client_id');
    const access_token = await returnValueFromJson('tokennuvemshop');
    const storeid = await returnValueFromJson('storeidnuvemshop');
  
    const config = {
      headers: {
        'Authentication': `bearer ${access_token}`,
        'User-Agent': `HostSync (${cli_id})`,
        'Content-Type': 'application/json',
      },
    };
  
    return [storeid, config];
  }
  
  async function preparingGetProductsAndVariants(page) {
    const infosNuvem = await getHeaderAndStore();
    let result = await getProductsAndVariants(infosNuvem[0], infosNuvem[1], page)
    return result
  }
  
  async function preparingPostProduct(product) {
    const infosNuvem = await getHeaderAndStore();
    const idHost = product.codigo;
    product.published = false;
    delete product.codigo;
    await registerProduct(infosNuvem[0], infosNuvem[1], product, idHost);
  }
  
  async function preparingUpdateProduct(idproduct, product) {
    const infosNuvem = await getHeaderAndStore();
    const idHost = product.codigo;
    delete product.codigo;
    delete product.attributes;

    try {
      const imagesResponse = await axios.get(`https://api.nuvemshop.com.br/v1/${infosNuvem[0]}/products/${idproduct}/images`, infosNuvem[1]);

      if (Array.isArray(imagesResponse.data) && imagesResponse.data.length > 0) {
        product.published = true;
      } else {
        product.published = false;
      }

      await updateProduct(infosNuvem[0], infosNuvem[1], product, idproduct, idHost);

    } catch (error) {
      if (!error.response) {
        console.log(`Erro de rede ao verificar imagens do produto ${idproduct}`, error.code || error.message);
        gravarLog(`Erro de rede ao verificar imagens do produto ${idproduct}: ${error.code || error.message}`);
        return
      }
      else if (error.response.data?.description === 'Product with such id does not exist'){
        console.log(`Produto ${idproduct} nao existe na NuvemShop, removendo vinculo local`);
        await successHandlingRequests('product', 'delete', idHost, idproduct, null)
        .then(() => {
          return
        })
      }
      else {
        console.log(`Erro ao verificar imagens do produto ${idproduct}`, error.response?.data || error.message);
        gravarLog(`Erro ao verificar imagens do produto ${idproduct}: ${JSON.stringify(error.response?.data) || error.message}`);
        return
      }
    }
   
  }
  
  async function preparingDeleteProduct(idHost, idproduct){
    const infosNuvem = await getHeaderAndStore();
    await deleteProduct(infosNuvem[0], infosNuvem[1], idproduct, idHost);
  }
  
  async function preparingPostCategory(category) {
    const infosNuvem = await getHeaderAndStore();
    const body = { name: category };
    const id = await registerCategory(infosNuvem[0], infosNuvem[1], body, 'category', category);
    return id ?? null;
  }
  
  async function preparingPostSubCategory(category, subcategory, category_id) {
    const infosNuvem = await getHeaderAndStore();
    const body = {
      name: subcategory,
      parent: category_id,
    };
    const id = await registerCategory(infosNuvem[0], infosNuvem[1], body, 'subcategory', category);
    return id ?? null;
  }
  
  async function preparingPostVariation(variant, idProduct, idProductHost) {
    const infosNuvem = await getHeaderAndStore();
    delete variant.codigo;
    await registerVariation(infosNuvem[0], infosNuvem[1], variant, idProduct, idProductHost);
  }
  
  async function preparingUpdateVariation(variant, idVariant, idProduct, idProductHost) {
    const infosNuvem = await getHeaderAndStore();
    delete variant.codigo;
    await updateVariation(infosNuvem[0], infosNuvem[1], variant, idProduct, idVariant, idProductHost);
  }
  
  async function preparingDeleteVariation(idVariant, idProduct, idProductHost, grade, stockProduct) {
    const infosNuvem = await getHeaderAndStore();
    await deleteVariation(infosNuvem[0], infosNuvem[1], idProduct, idVariant, idProductHost, grade, stockProduct);
  }

  /*
  async function preparingDeletePermanentVariant(idproduct, idvariant) {
    const infosNuvem = await getHeaderAndStore();
    await deleteVariation(infosNuvem[0], infosNuvem[1], idproduct, idvariant);
  }
  */



  async function preparingGenerateToken(code) {
    const client_secret = await returnInfo('client_secret');
    const client_id = await returnInfo('client_id');
    const body = {
      client_id,
      client_secret,
      grant_type: 'authorization_code',
      code,
    };
    return await generateToken(body);
  }
  
  module.exports = {
    preparingGetProductsAndVariants,
    preparingPostProduct,
    preparingUpdateProduct,
    preparingDeleteProduct,
    preparingPostCategory,
    preparingPostSubCategory,
    preparingPostVariation,
    preparingUpdateVariation,
    preparingDeleteVariation,
    preparingGenerateToken,
  };
  