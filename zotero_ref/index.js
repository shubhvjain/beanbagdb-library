import axios from "axios";
const BASE_URL = `https://api.zotero.org`;

export const add_ref_to_all_items = async (acc)=>{
  let d = await get_all_group_items(acc)
  let updates = []
  for (let index = 0; index < d.length; index++) {
    const element = d[index];
    let a = await add_ref_to_item(acc,element)
    //console.log(a)
    if(a){
      updates.push(a)
    }
  }
  return updates
}

export const get_all_group_items = async (acc) => {
  try {
    let fetch_items_url = BASE_URL + `/groups/${acc.group_id}/items`;
    const response = await axios.get(fetch_items_url, {
      headers: {
        "Zotero-API-Key": acc.key,
        Accept: "application/json",
      },
      params: {
        // limit: 50, // Number of items to fetch (max 100 per request)
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching Zotero collection:",
      error.response ? error.response.data : error.message
    );
  }
};

export const generate_random_ref_id = () => {
  return generate_Fixed_Length_Hex();
};

const generate_Fixed_Length_Hex = () => {
  const min = 101; // Minimum value (greater than 100)
  const max = 9999; // Maximum value (less than 9999)
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  // Convert the number to hexadecimal
  const hexString = randomNumber.toString(16);
  // Ensure the hexadecimal string is always 4 characters long
  return hexString.padStart(4, "0");
};

export const add_ref_to_item = async (acc,item)=>{
  // check if it already has, if not add it.
  /**
   * 1. check if tag starting with . exists
   * 2. check if "extra" field has .[hex] thing
   * 3. if it does exists, exit
   * 4. if not, add a new id
   * 5. generate a new id
   * 6. add it to extra and tags
   * 7. update the item 
   */
  console.log(item)
  let id_check = check_Id_Exists(item)
  let update = {}
  let new_id = `.[${generate_random_ref_id()}]`
  if (!id_check.extra){
    if(!update.data){update.data = {}}
    let extra = item["data"]["extra"]
    update["data"]["extra"] = `${new_id} ${extra}`
  }
  if(!id_check.tag){
    if(!update.data){update.data = {}}
    let tgs = item.data.tags
    tgs.push({tag:new_id})
    update.data.tags = tgs
  }
  
  if(Object.keys(update).length>0){
    try {
      update.version = item.version
      //console.log(JSON.stringify(update,null,1))
      let resp = await edit_zotero_item(acc,item.key,update)
      //console.log(resp)   
      return {message:`added new id:${new_id} for title:${item.data.title}`}
    } catch (error) {
      console.log(error)
      return {message:`Error in updating title:${item.title}, message:${error.message}`}
    }
  }else{
    return null
  }
}
let check_Id_Exists = (obj)=>{
  // Regex to match the pattern .[hex_id] where hex_id is a 4-character hexadecimal
  const hexPattern = /\.\[[a-fA-F0-9]{4}\]/;
  // Check the `extra` field for a match
  const extraFieldContainsHexId = hexPattern.test(obj.data.extra);
  // Check the `tags` array for a match
  const tagContainsHexId = obj.data.tags.some(tag => hexPattern.test(tag.tag));
  // Return true if the ID exists in both places
  return {extra :extraFieldContainsHexId, tag:tagContainsHexId};
}

const edit_zotero_item = async (acc,item_key, new_updates) => {
  try {
    let fetch_items_url =
      BASE_URL + `/groups/${acc.group_id}/items/${item_key}`;
    const response = await axios.patch(fetch_items_url, new_updates, {
      headers: {
        "Zotero-API-Key": acc.key,
        Accept: "application/json",
        "If-Unmodified-Since-Version":new_updates.version
      },
    });
    return response.data;
    //console.log("Zotero Collection Items:", response.data);
  } catch (error) {
    console.error(
      "Error updating Zotero item:",
      error.response ? error.response.data : error.message
    );
  }
};
