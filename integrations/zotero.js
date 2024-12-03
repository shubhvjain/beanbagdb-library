import axios from "axios";
const BASE_URL = `https://api.zotero.org`;

/**
 * Fetches all the records from the specified "group_id"
 * @param {*} acc zotero acc details object. Must contain key, user_name, group_id
 */
export const get_all_records = async (acc) => {
  let items = [];
  let start = 0;
  const limit = 100; // Maximum items per request

  try {
    while (true) {
      // Fetch a batch of items
      let fetch_items_url =
        BASE_URL +
        `/groups/${acc.group_id}/items?start=${start}&limit=${limit}`;
      const response = await fetch(fetch_items_url, {
        headers: {
          "Zotero-API-Key": acc.key,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        break;
      }

      const batch = await response.json();
      if (batch.length === 0) break; // Exit loop if no more items

      items = items.concat(batch);
      start += batch.length;
      //console.log(`Fetched ${batch.length} items...`);
    }
    return items;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const get_recent_records = async (last_modified_date) => {

};

export const add_ref_to_all_items = async (acc) => {
  let d = await get_all_group_items(acc);
  console.log();
  let updates = [];
  let bulk_update_docs_batch = [[]];
  for (let index = 0; index < d.length; index++) {
    const element = d[index];
    try {
      let a = check_item_update_required(element);
      console.log(JSON.stringify(a, null, 1));
      let batch_index = 0;
      console.log(a);
      if (a) {
        if (bulk_update_docs_batch[batch_index].length == 49) {
          batch_index++;
          bulk_update_docs_batch.push([]);
        }
        bulk_update_docs_batch[batch_index].push(a);
      }
    } catch (error) {
      console.log(error);
    }
  }
  //console.log(JSON.stringify(d))
  //console.log(JSON.stringify(bulk_update_docs_batch));

  for (let index = 0; index < bulk_update_docs_batch.length; index++) {
    const element = bulk_update_docs_batch[index];
    try {
      let a = await edit_items_bulk(acc, element);
      updates.push(a);
    } catch (error) {
      console.log(error);
    }
  }
  return updates;
};

export const edit_items_bulk = async (acc, item_updates) => {
  console.log(JSON.stringify(item_updates, null, 1));
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

export const check_item_update_required = (item) => {
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
  console.log(JSON.stringify(item.data, null, 1));
  let id_check = check_Id_Exists(item);
  console.log();
  let update = {};
  let new_id = `.[${generate_random_ref_id()}]`;
  if (item.data.type == "note") {
    return null;
  }
  if (!id_check.extra) {
    if (!update.data) {
      update.data = {};
    }
    let extra = item["data"]["extra"];
    update["data"]["extra"] = `${new_id} ${extra || ""}`;
  }
  if (!id_check.tag) {
    if (!update.data) {
      update.data = {};
    }
    let tgs = item.data.tags;
    tgs.push({ tag: new_id });
    update.data.tags = tgs;
  }

  if (Object.keys(update).length > 0) {
    update.version = item.version;
    update.key = item.key;
    return {
      update_required: true,
      message: `added new id:${new_id} for title:${item.data.title}`,
      update,
      full_item: item,
    };
    // try {
    //   //console.log(JSON.stringify(update,null,1))
    //   // let resp = await edit_zotero_item(acc,item.key,update)
    //   //console.log(resp)
    // } catch (error) {
    //   console.log(error)
    //   return { update_required:true,  message:`Error in updating title:${item.title}, message:${error.message}`}
    // }
  } else {
    return null;
  }
};
let check_Id_Exists = (obj) => {
  // Regex to match the pattern .[hex_id] where hex_id is a 4-character hexadecimal
  const hexPattern = /\.\[[a-fA-F0-9]{4}\]/;
  // Check the `extra` field for a match
  const extraFieldContainsHexId = hexPattern.test(obj.data.extra);
  // Check the `tags` array for a match
  const tagContainsHexId = obj.data.tags.some((tag) =>
    hexPattern.test(tag.tag)
  );
  // Return true if the ID exists in both places
  return { extra: extraFieldContainsHexId, tag: tagContainsHexId };
};

const edit_zotero_item = async (acc, item_key, new_updates) => {
  try {
    let fetch_items_url =
      BASE_URL + `/groups/${acc.group_id}/items/${item_key}`;
    const response = await axios.patch(fetch_items_url, new_updates, {
      headers: {
        "Zotero-API-Key": acc.key,
        Accept: "application/json",
        "If-Unmodified-Since-Version": new_updates.version,
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
