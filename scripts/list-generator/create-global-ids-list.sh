gids="/home/ec2-user/files/off_chain_metadata_global_ids_uniq"
mints="/home/ec2-user/files/magic_eden_mint_ids_uniq"
awk 'NR==FNR{A[$1];next}$2 in A' $mints $gids
